import { useState, useMemo } from "react";

// ─── Types (mirrors your product_fields shape) ────────────────────────────────

export interface FieldOption {
    id: string;
    field_id: string;
    label: string;
    value: string;
    display_order: number;
}

export interface ProductField {
    id: string;
    product_id: string;
    field_key: string;
    label: string;
    field_type: "select" | "textarea" | "text" | string;
    required: boolean;
    placeholder: string | null;
    max_length: number | null;
    display_order: number;
    options: FieldOption[];
}

export type FieldValue = string; // option value for select, raw text for textarea/text

export type FieldErrors = Record<string, string>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProductForm(fields: ProductField[] | undefined) {
    const sortedFields = useMemo(
        () => (fields ? [...fields].sort((a, b) => a.display_order - b.display_order) : []),
        [fields]
    );

    const [values, setValues] = useState<Record<string, FieldValue>>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [quantity, setQuantity] = useState(1);

    const MIN_QUANTITY = 1;
    const MAX_QUANTITY = 10;

    function setValue(fieldKey: string, value: FieldValue) {
        setValues((prev) => ({ ...prev, [fieldKey]: value }));
        setErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    }

    function incrementQuantity() {
        setQuantity((q) => Math.min(q + 1, MAX_QUANTITY));
    }

    function decrementQuantity() {
        setQuantity((q) => Math.max(q - 1, MIN_QUANTITY));
    }

    function validate(): boolean {
        const nextErrors: FieldErrors = {};

        for (const field of sortedFields) {
            if (!field.required) continue;
            const val = values[field.field_key];
            if (!val || !val.trim()) {
                nextErrors[field.field_key] = `${field.label} is required.`;
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function reset() {
        setValues({});
        setErrors({});
        setQuantity(1);
    }

    return {
        sortedFields,
        values,
        errors,
        setValue,
        validate,
        reset,
        quantity,
        incrementQuantity,
        decrementQuantity,
        minQuantity: MIN_QUANTITY,
        maxQuantity: MAX_QUANTITY,
    };
}