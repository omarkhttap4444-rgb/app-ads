-- Apply BEFORE deploying the new web publisher. Additive; existing RLS/triggers stay active.
-- The function-local constant storage origin is pinned to this production project.
-- On a different Supabase project, change ONLY that origin before applying.
BEGIN;

-- Durable idempotency receipt. Deliberately NO product FK/cascade: a deleted ad
-- must not be resurrected by an old retry. Account deletion still erases receipts.
CREATE TABLE IF NOT EXISTS public.web_product_publications (
  product_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_payload jsonb NOT NULL,
  image_paths text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS web_product_publications_user_id_idx
  ON public.web_product_publications(user_id);
ALTER TABLE public.web_product_publications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_product_publications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.web_product_publications TO authenticated;
DROP POLICY IF EXISTS web_publications_read_own ON public.web_product_publications;
CREATE POLICY web_publications_read_own ON public.web_product_publications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS web_publications_insert_own ON public.web_product_publications;
CREATE POLICY web_publications_insert_own ON public.web_product_publications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.publish_web_product(
  p_product_id uuid,
  p_product jsonb,
  p_image_paths text[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_storage_origin CONSTANT text := 'https://xcjbjqndflhzmsxiasdb.supabase.co';
  v_uid uuid := auth.uid();
  v_profile public.users%ROWTYPE;
  v_category public.categories%ROWTYPE;
  v_existing public.products%ROWTYPE;
  v_receipt public.web_product_publications%ROWTYPE;
  v_path text;
  v_urls text[] := ARRAY[]::text[];
  v_price double precision;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR jsonb_typeof(p_product) IS DISTINCT FROM 'object'
     OR coalesce(cardinality(p_image_paths), 0) NOT BETWEEN 1 AND 4 THEN
    RAISE EXCEPTION 'Invalid publication request' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(DISTINCT path) FROM unnest(p_image_paths) AS path) <> cardinality(p_image_paths) THEN
    RAISE EXCEPTION 'Images must be distinct and non-null' USING ERRCODE = '22023';
  END IF;

  -- All retries for this seller serialize; reusing an ID cannot create a second ad.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  FOREACH v_path IN ARRAY p_image_paths LOOP
    IF v_path !~ ('^products/' || v_uid::text || '/' || p_product_id::text || '-[0-3]\.(jpg|png|webp|gif)$') THEN
      RAISE EXCEPTION 'Invalid image ownership or path' USING ERRCODE = '22023';
    END IF;
    v_urls := array_append(v_urls, v_storage_origin ||
      '/storage/v1/object/public/product-images/' || v_path);
  END LOOP;

  SELECT * INTO v_receipt FROM public.web_product_publications WHERE product_id = p_product_id;
  IF FOUND THEN
    IF v_receipt.product_payload IS DISTINCT FROM p_product OR v_receipt.image_paths IS DISTINCT FROM p_image_paths THEN
      RAISE EXCEPTION 'Publication ID cannot be reused with different data' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_existing FROM public.products WHERE id = p_product_id AND seller_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Previous publication is no longer available; do not recreate' USING ERRCODE = '55000';
    END IF;
    SELECT count(*) INTO v_count FROM public.product_images
      WHERE product_id = p_product_id AND user_id = v_uid AND image_url = ANY(v_urls);
    IF v_count <> cardinality(v_urls) THEN
      RAISE EXCEPTION 'Existing publication has a different image manifest' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id', v_existing.id, 'slug', v_existing.slug, 'image_count', v_count);
  END IF;

  SELECT * INTO v_profile FROM public.users WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller profile required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_category FROM public.categories
    WHERE id = p_product->>'category_id' AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active category required' USING ERRCODE = '22023';
  END IF;
  v_price := (p_product->>'price')::double precision;
  IF coalesce(length(btrim(p_product->>'name')), 0) NOT BETWEEN 3 AND 300
     OR coalesce(length(btrim(p_product->>'description')), 0) NOT BETWEEN 10 AND 20000
     OR coalesce(length(btrim(p_product->>'location')), 0) NOT BETWEEN 1 AND 300
     OR v_price IS NULL OR v_price < 0 OR v_price >= 'Infinity'::double precision
     OR jsonb_typeof(p_product->'specifications') IS DISTINCT FROM 'object'
     OR (p_product->>'condition') IS NULL THEN
    RAISE EXCEPTION 'Invalid product details' USING ERRCODE = '22023';
  END IF;

  -- Verify every upload exists in OUR bucket before making an ad visible.
  FOREACH v_path IN ARRAY p_image_paths LOOP
    IF NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE bucket_id = 'product-images' AND name = v_path
        AND metadata->>'mimetype' IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
        AND (metadata->>'size')::bigint BETWEEN 1 AND 10485760
    ) THEN
      RAISE EXCEPTION 'Uploaded image missing or invalid' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Explicit whitelist: caller cannot choose seller identity, moderation state or counters.
  -- Existing category, ad_number, slug, moderation and RLS checks remain in force.
  INSERT INTO public.products (
    id, name, description, price, category, category_id, specifications,
    seller_id, seller_name, seller_avatar, is_negotiable, condition, location
  ) VALUES (
    p_product_id, btrim(p_product->>'name'), btrim(p_product->>'description'), v_price,
    v_category.name, v_category.id, p_product->'specifications',
    v_uid, coalesce(v_profile.name, 'بائع سوق فون'), v_profile.profile_image_url,
    coalesce((p_product->>'is_negotiable')::boolean, false),
    p_product->>'condition', btrim(p_product->>'location')
  );
  INSERT INTO public.product_images (product_id, user_id, image_url)
    SELECT p_product_id, v_uid, url FROM unnest(v_urls) AS url;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> cardinality(v_urls) THEN
    RAISE EXCEPTION 'Incomplete image insert' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.web_product_publications (product_id, user_id, product_payload, image_paths)
    VALUES (p_product_id, v_uid, p_product, p_image_paths);
  SELECT * INTO v_existing FROM public.products WHERE id = p_product_id;
  RETURN jsonb_build_object('id', v_existing.id, 'slug', v_existing.slug, 'image_count', v_count);
  -- Do not catch exceptions: PostgreSQL rolls back BOTH inserts on ANY failure.
END;
$$;

REVOKE ALL ON FUNCTION public.publish_web_product(uuid, jsonb, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_web_product(uuid, jsonb, text[]) TO authenticated;
COMMENT ON FUNCTION public.publish_web_product(uuid, jsonb, text[]) IS
  'Atomic, authenticated web publication with preuploaded images and product-ID idempotency. Invoker RLS retained.';
NOTIFY pgrst, 'reload schema';
COMMIT;
