# knowledge-base-bra

## CMS setup

Run `sql/cms.sql` in Supabase SQL Editor. The migration creates the CMS fields and
the public `cms-materials` Storage bucket used for PDF and image uploads.

Set these Vercel environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `CMS_ADMIN_EMAILS` (comma-separated admin email addresses)

Admins can select Order, MRP, Purchase, Inventory, Production, or Shipment;
published materials are added as children in that module's sidebar. Use
`Overview` for a module summary without an image and `Detail` for richer
content with text, image, video, and/or PDF.

## Admin editor

Open `admin.html` after signing in with an address listed in
`CMS_ADMIN_EMAILS`. The editor supports:

- Rich text formatting, headings, lists, inline images, and MP4/WebM videos.
- PDF, cover image, and media uploads through the `cms-materials` bucket.
- Adding, renaming, ordering, and removing modules and sidebar pages without
	editing JSON or HTML.

The implementation uses Supabase Storage and database tables through the
existing Vercel middleware endpoints, so PHP is not required. Run the SQL
migration before the first save and redeploy after changing server-side code.
