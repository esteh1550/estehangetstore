# E STORE / Estehanget - Improvements in this revision

## Cart reliability
- Cart quantity and removal now target a unique combination of product ID + selected size.
- Different sizes of the same product can coexist safely in the cart.
- Quantity increases are capped at the product's current stock.
- Checkout blocks when an item is sold out or requested quantity exceeds stock.
- Checkout order payload now preserves the selected shoe size.
- Empty/whitespace-only customer fields are rejected.

## Verification note
- Source-level changes were reviewed directly.
- Full `npm ci` / Vite build could not be completed in this environment because dependency installation timed out.
