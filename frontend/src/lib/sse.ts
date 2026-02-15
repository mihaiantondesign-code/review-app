type Review = {
  date: string;
  rating: number;
  title: string;
  review: string;
  author: string;
  version: string;
};

export interface SSECallbacks {
  onProgress?: (data: {
    page: number;
    total_pages: number;
    reviews_so_far: number;
    message: string;
  }) => void;
  onBusinessInfo?: (data: {
    name: string;
    trustScore: number;
    stars: number;
    totalReviews: number;
  }) => void;
  onReviewsChunk?: (data: { reviews: Review[] }) => void;
  onComplete?: (data: {
    reviews: Review[];
    total: number;
    business_info?: {
      name: string;
      trustScore: number;
      stars: number;
      totalReviews: number;
    } | null;
  }) => void;
  onError?: (data: { message: string }) => void;
}

export function consumeSSE(url: string, callbacks: SSECallbacks): () => void {
  const abortController = new AbortController();

  (async () => {
    try {
      const response = await fetch(url, { signal: abortController.signal });
      if (!response.ok || !response.body) {
        callbacks.onError?.({ message: `HTTP ${response.status}` });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              switch (currentEvent) {
                case "progress":
                  callbacks.onProgress?.(data);
                  break;
                case "business_info":
                  callbacks.onBusinessInfo?.(data);
                  break;
                case "reviews_chunk":
                  callbacks.onReviewsChunk?.(data);
                  break;
                case "complete":
                  callbacks.onComplete?.(data);
                  break;
                case "error":
                  callbacks.onError?.(data);
                  break;
              }
            } catch {
              // skip malformed JSON
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        callbacks.onError?.({ message: String(err) });
      }
    }
  })();

  return () => abortController.abort();
}
