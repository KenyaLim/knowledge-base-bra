# knowledge-base-bra

## CMS setup

FEATURES NOW
- EDITABLE IN HTML ADMIN
- STORAGE SUPABASE
- SEARCH BAR

Run `sql/cms.sql` in Supabase SQL Editor. The migration creates the CMS fields and
the public `cms-materials` Storage bucket used for PDF and image uploads.

Set these Vercel environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `CMS_ADMIN_EMAILS` (comma-separated admin email addresses)
- `MANUAL_USERS` (optional JSON for local accounts, without Supabase)

Example `MANUAL_USERS` value:

```json
[
  {"username":"viewer","password":"change-this-password","name":"Viewer","role":"user"},
  {"username":"admin","password":"change-this-password","name":"Admin","role":"admin"}
]
```

Manual accounts use `user` (view-only) by default. Only an account with
`"role":"admin"` can open the CMS admin page or create, edit, delete, and
upload materials. Store this JSON in Vercel Environment Variables and replace
the example passwords before deployment. Supabase login remains available when
`SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured.

Admins can select Order, MRP, Purchase, Inventory, Production, or Shipment;
published materials are added as children in that module's sidebar. Use
`Overview` for a module summary without an image and `Detail` for richer
content with text, image, and/or PDF.

The dashboard is organized by application: choose STAGE or PROMAN from
`index.html`, then use the application's Home page to open its related
modules. STAGE includes Order, Costing, MRP, Purchase, Inventory, Packing,
Shipping, and Address; PROMAN includes Time Study, Fabric & Trims Inward,
Fabric Issue, Cutting, Production, and Quality Control.
