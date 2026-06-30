// types/cart.ts

export type CartItemCustomization = {
    id: string;
    field_key: string;
    field_label: string;
    selected_value: string;
};

export type CartItemProduct = {
    id: string;
    name: string;
    image_url: string | null;
};

export type CartItem = {
    id: string;
    product_id: string;
    product: CartItemProduct | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    created_at: string;
    customizations: CartItemCustomization[];
};

export type Cart = {
    id: string;
    order_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    total: number;
    items: CartItem[];
};

// Input shape for adding an item — customizations keyed simply,
// matches what you'd build from a product customization form.
export type AddCartItemInput = {
    cartId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    customizations?: Array<{
        field_key: string;
        field_label: string;
        selected_value: string;
    }>;
};
