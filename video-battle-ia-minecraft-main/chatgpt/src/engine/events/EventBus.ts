type EventPayloadMap = {
  daylightChanged: { daylight: number };
  timePhaseChanged: { phase: 'day' | 'dusk' | 'night' };
};

type EventKey = keyof EventPayloadMap;
type EventHandler<T extends EventKey> = (payload: EventPayloadMap[T]) => void;

export class EventBus {
  private readonly handlers: { [K in EventKey]: Set<EventHandler<K>> } = {
    daylightChanged: new Set(),
    timePhaseChanged: new Set(),
  };

  subscribe<T extends EventKey>(key: T, handler: EventHandler<T>): () => void {
    this.handlers[key].add(handler as EventHandler<EventKey>);
    return () => {
      this.handlers[key].delete(handler as EventHandler<EventKey>);
    };
  }

  emit<T extends EventKey>(key: T, payload: EventPayloadMap[T]): void {
    for (const handler of this.handlers[key]) {
      handler(payload);
    }
  }
}
