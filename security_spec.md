# Firestore Security Specification - ESTEHANGET

## Data Invariants
1. **Store**: Only the admin (`eepsyarief20@gmail.com`) can create or update stores. Publicly readable.
2. **Product**: Only the admin can manage products. Publicly readable.
3. **Review**: Any signed-in user can create a review. Reviewers can only review once per product (optional, but for now simple). Publicly readable.
4. **Order**: Only the admin can read/write the central `orders` collection.
5. **Customer Order**: Guests can create orders. Only admin can read/manage.
6. **Newsletter**: Public can subscribe (create). Only admin can read.

## The "Dirty Dozen" Payloads (Test Cases)
1. **Unauthenticated store creation**: `request.auth == null` -> `DENY`
2. **Non-admin product update**: `request.auth.token.email != 'eepsyarief20@gmail.com'` -> `DENY`
3. **Product ID poisoning**: `productId` size > 128 -> `DENY`
4. **Negative product price**: `price: -1000` -> `DENY`
5. **Shadow field in Store**: Adding `internalBadge: "gold"` to store data -> `DENY`
6. **Review identity spoofing**: `resource.data.userId` != `request.auth.uid` -> `DENY`
7. **Massive string injection**: `name.size() > 200` -> `DENY`
8. **Guest access to Newsletter**: Guest trying to list newsletter entries -> `DENY`
9. **Guest access to Orders**: Guest trying to read other orders -> `DENY`
10. **Admin role hijack**: User attempting to write to `/admins/{uid}` -> `DENY`
11. **Malformed Category**: `category` not in ['gadget', 'pakaian', 'sepatu', 'digital'] -> `DENY`
12. **Missing required fields**: Creating a product without `price` -> `DENY`

## Master Gate & Validation Helper Blueprint
Rules will use `isValid[Entity]()` for all write operations and enforce exact key matching using `affectedKeys().hasOnly()`.
