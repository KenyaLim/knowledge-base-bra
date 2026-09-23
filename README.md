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
content with text, image, and/or PDF.
