# 00. Strategy: Frenly AI - Future Roadmap (Phase 5+)

> **Goal:** Move beyond "Assistant" to "Active Investigator".
> **Context:** Current status is "Reactive" (User asks, AI answers). The future is "Proactive" & "Multimodal".

## 1. Local RAG (The "Elephant" Memory)
*   **Concept:** Currently, Frenly only knows what is on the screen. **Local RAG (Retrieval Augmented Generation)** allows Frenly to "remember" every case file ever closed on this machine.
*   **User Query:** "Has this phone number appeared in any investigations from 2023?"
*   **Tech:** `ChromaDB` (Local Vector Store) running inside Electron. Indexing occurs in a background Web Worker.
*   **Value:** Connects the dots across years of disconnected data.

## 2. Visual Reasoning (Multimodal Analysis)
*   **Concept:** Drag-and-drop a scanned check or contract into the chat.
*   **Capabilities:**
    *   **Signature Matching:** "This signature matches 'John Doe' from Case #99 with 85% confidence."
    *   **Forgery Layout:** "The pixels around the 'Amount' field suggest digital alteration."
*   **Tech:** Integration with clear-bit/local Vision Transformers (e.g., `Moondream` quantized for local execution).

## 3. "The Devil's Advocate" (Red Teaming)
*   **Concept:** A dedicated Persona specifically designed to *disprove* the user's theory.
*   **Workflow:**
    1.  User: "I think Subject A is guilty of embezzlement."
    2.  Frenly (Red Team): "Here are 3 pieces of evidence that contradict that theory. Have you considered they might be a victim of identity theft?"
*   **Value:** Prevents "Confirmation Bias" – a critical failure in investigations.

## 4. Voice Command Center ("Jarvis" Mode)
*   **Concept:** Hands-free control for high-speed analysis.
*   **Commands:**
    *   "Frenly, highlight all transactions over $10k."
    *   "Map the relationship between Node A and Node B."
*   **Tech:** WebSpeech API (Native) bridged to the `useContextAwareAI` hook.

## 5. Auto-Drafting (Legal Engineering)
*   **Concept:** Generative output for legal documents.
*   **Capabilities:**
    *   **Subpoenas:** "Write a subpoena for Bank of America requesting all records for Account X."
    *   **Affidavits:** "Draft an affidavit summarizing the 'Shell Company' pattern."
*   **Safety:** Templates are "Fill in the blank" to ensure legal compliance, with AI only suggesting the narrative content.

---

## 6. Comparison: Today vs. Future

| Feature | Today (Phase 4) | Future (Phase 5+) |
| :--- | :--- | :--- |
| **Scope** | Current Page Context | Entire Case History (RAG) |
| **Input** | Text Chat | Text, Voice, Images |
| **Role** | Helper | Partner / Red Teamer |
| **Memory** | Session Only | Permanent Vector Store |
