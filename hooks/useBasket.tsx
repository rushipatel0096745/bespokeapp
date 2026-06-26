// hooks/useBasket.ts
// Temporary in-memory basket — no backend, no Supabase
// Drop-in replacement once real basket service is ready
// All state lives in React Context + AsyncStorage for persistence across app restarts

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BasketItem {
    productId: string;
    name: string;
    price: number; // in pence e.g. 2499 = £24.99
    imageUrl?: string;
    quantity: number;
}

export interface AddItemPayload {
    productId: string;
    name: string;
    price: number;
    imageUrl?: string;
    quantity?: number; // defaults to 1
}

interface BasketState {
    items: BasketItem[];
    linkedTicketId: string | null; // the order chat thread this basket is for
}

type BasketAction =
    | { type: "ADD_ITEM"; payload: AddItemPayload }
    | { type: "REMOVE_ITEM"; productId: string }
    | { type: "INCREMENT"; productId: string }
    | { type: "DECREMENT"; productId: string }
    | { type: "CLEAR" }
    | { type: "SET_TICKET"; ticketId: string }
    | { type: "HYDRATE"; state: BasketState };

interface BasketContextValue {
    items: BasketItem[];
    linkedTicketId: string | null;
    total: number; // total in pence
    totalFormatted: string; // e.g. "£24.99"
    itemCount: number; // total quantity across all items
    isInBasket: (productId: string) => boolean;
    quantityOf: (productId: string) => number;
    addItem: (payload: AddItemPayload) => void;
    removeItem: (productId: string) => void;
    increment: (productId: string) => void;
    decrement: (productId: string) => void;
    clear: () => void;
    setLinkedTicket: (ticketId: string) => void;
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "@mmc_basket_v1";

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: BasketState = {
    items: [],
    linkedTicketId: null,
};

function basketReducer(state: BasketState, action: BasketAction): BasketState {
    switch (action.type) {
        case "HYDRATE":
            return action.state;

        case "ADD_ITEM": {
            const { productId, name, price, imageUrl, quantity = 1 } = action.payload;
            const existing = state.items.find((i) => i.productId === productId);
            if (existing) {
                // Already in basket — increment quantity instead of duplicating
                return {
                    ...state,
                    items: state.items.map((i) =>
                        i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
                    ),
                };
            }
            return {
                ...state,
                items: [...state.items, { productId, name, price, imageUrl, quantity }],
            };
        }

        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter((i) => i.productId !== action.productId),
            };

        case "INCREMENT":
            return {
                ...state,
                items: state.items.map((i) =>
                    i.productId === action.productId ? { ...i, quantity: i.quantity + 1 } : i
                ),
            };

        case "DECREMENT": {
            const item = state.items.find((i) => i.productId === action.productId);
            if (!item) return state;
            // Remove from basket if quantity would drop below 1
            if (item.quantity <= 1) {
                return {
                    ...state,
                    items: state.items.filter((i) => i.productId !== action.productId),
                };
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.productId === action.productId ? { ...i, quantity: i.quantity - 1 } : i
                ),
            };
        }

        case "CLEAR":
            return { ...state, items: [] };

        case "SET_TICKET":
            return { ...state, linkedTicketId: action.ticketId };

        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BasketContext = createContext<BasketContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BasketProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(basketReducer, initialState);

    // Hydrate from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (raw) {
                    const parsed: BasketState = JSON.parse(raw);
                    dispatch({ type: "HYDRATE", state: parsed });
                }
            })
            .catch(() => {
                // Silent fail — start with empty basket
            });
    }, []);

    // Persist to AsyncStorage on every state change
    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, [state]);

    // ── Derived values ────────────────────────────────────────────────────────

    const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const totalFormatted = `£${(total / 100).toFixed(2)}`;

    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const isInBasket = useCallback(
        (productId: string) => state.items.some((i) => i.productId === productId),
        [state.items]
    );

    const quantityOf = useCallback(
        (productId: string) => state.items.find((i) => i.productId === productId)?.quantity ?? 0,
        [state.items]
    );

    // ── Actions ───────────────────────────────────────────────────────────────

    const addItem = useCallback((payload: AddItemPayload) => dispatch({ type: "ADD_ITEM", payload }), []);

    const removeItem = useCallback((productId: string) => dispatch({ type: "REMOVE_ITEM", productId }), []);

    const increment = useCallback((productId: string) => dispatch({ type: "INCREMENT", productId }), []);

    const decrement = useCallback((productId: string) => dispatch({ type: "DECREMENT", productId }), []);

    const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

    const setLinkedTicket = useCallback((ticketId: string) => dispatch({ type: "SET_TICKET", ticketId }), []);

    // ── Context value ─────────────────────────────────────────────────────────

    const value: BasketContextValue = {
        items: state.items,
        linkedTicketId: state.linkedTicketId,
        total,
        totalFormatted,
        itemCount,
        isInBasket,
        quantityOf,
        addItem,
        removeItem,
        increment,
        decrement,
        clear,
        setLinkedTicket,
    };

    return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBasket(): BasketContextValue {
    const ctx = useContext(BasketContext);
    if (!ctx) {
        throw new Error("useBasket must be used inside <BasketProvider>");
    }
    return ctx;
}

// ─── TODO: swap to real backend ───────────────────────────────────────────────
//
// When Supabase basket is ready:
//
// 1. Keep this file's interface (BasketContextValue) identical
//    so no screen or component needs to change.
//
// 2. Replace the useReducer + AsyncStorage logic with:
//    - useQuery to fetch basket rows from Supabase on mount
//    - useMutation for addItem, removeItem, increment, decrement, clear
//    - Optimistic updates so UI stays instant
//
// 3. Remove BasketProvider from app/_layout.tsx and use
//    TanStack Query's cache as the source of truth instead.
//
// Every consumer (AddOnsScreen, BasketScreen, ProductCard, etc.)
// calls useBasket() the same way — zero changes needed there.
