export interface PublisherPhoneFetchDecision {
  currentPhone: string | null;
  forceRefresh: boolean;
}

export function shouldFetchPublisherPhone(input: PublisherPhoneFetchDecision): boolean {
  return input.forceRefresh || !input.currentPhone;
}

export class PublisherPhoneSingleFlight {
  private readonly pending = new Map<string, Promise<unknown>>();

  run<T>(publisherKey: string, loader: () => Promise<T>): Promise<T> {
    const current = this.pending.get(publisherKey) as Promise<T> | undefined;
    if (current) return current;

    const pending = loader().finally(() => this.pending.delete(publisherKey));
    this.pending.set(publisherKey, pending);
    return pending;
  }
}
