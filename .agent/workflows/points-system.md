---
description: Points and Leaf Growth System
---

# Garden Economy: Points & Leaf Growth

In Narinyland, the relationship grows as you interact and redeem shared experiences. Here is the logic for the points and leaf growth system:

## 1. Earning Points (Coupon Redemption)
- When a partner redeems a **Love Coupon**, points are credited to the shared garden balance.
- Coupons have specific point values assigned during creation.
- Points are used as the primary currency for garden decorations and growth.

## 2. Growing the Tree (Buying Leaves)
- Users can "buy" or "grow" a new leaf for the 3D Love Tree.
- **Cost**: 100 Points per leaf.
- **Mechanism**:
    - Clicking the Floating Leaf Button (bottom right).
    - If the user has >= 100 points, the button is active.
    - On click, 100 points are deducted, and `loveStats.leaves` is incremented.

## 3. Experience and Leveling
- Growing a leaf also contributes to the garden's **EXP (XP)**.
- Each leaf grown adds towards the **Level Up** progress.
- Leveling up triggers:
    - Special messages from **Nari (the Pet)**.
    - Evolution of the pet's appearance or behavior.
    - Unlocking new features or themes.

## 4. Visual Feedback
- **Excited Pet**: Nari celebrates when a leaf is grown or a level is reached.
- **Garden Growth**: The 3D scene dynamically reflects the number of leaves grown by the couple.
