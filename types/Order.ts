export interface Order {
    id: string;
    ticketId: string;
    babyName: string;
    printType: string;
    status: "proof_ready" | "awaiting_proof" | "approved" | "dispatched";
    submittedAt: string;
}
