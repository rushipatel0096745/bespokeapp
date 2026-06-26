export interface Product {
    id: string;

    name: string;

    slug: string;

    category: string;

    description: string | null;

    price: number;

    image_url: string | null;

    is_active: boolean;

    display_order: number;

    created_at: string;

    updated_at: string;
}

export interface ProductField {
    id: string;

    product_id: string;

    field_key: string;

    label: string;

    field_type: string;

    required: boolean;

    placeholder: string | null;

    max_length: number | null;

    display_order: number;
}

export interface ProductFieldOption {
    id: string;

    field_id: string;

    label: string;

    value: string;

    display_order: number;
}

export interface ProductFieldWithOptions extends ProductField {
    options: ProductFieldOption[];
}
