"use client";

interface CustomerSelectionOverlayProps {
  onDineInClick: () => void;
  onPickupClick: () => void;
  onDeliveryClick: () => void;
}

export function CustomerSelectionOverlay({
  onDineInClick,
  onPickupClick,
  onDeliveryClick,
}: CustomerSelectionOverlayProps) {
  return (
    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm z-[100] flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Select Order Type
            </h2>
            <p className="text-sm text-neutral-400">
              Choose how the customer will receive their order
            </p>
          </div>

          {/* Order Type Selection - 3 Big Boxes Stacked */}
          <div className="space-y-4">
            <button
              onClick={onPickupClick}
              className="w-full rounded-2xl bg-neutral-800/80 border-2 border-neutral-700/50 p-8 hover:bg-neutral-800 hover:border-emerald-500/50 transition-all active:scale-[0.98] flex items-center gap-6 group"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shrink-0">
                📦
              </div>
              <div className="flex-1 text-left">
                <div className="text-2xl font-bold text-white mb-2">Pickup</div>
                <div className="text-sm text-neutral-300">Customer will pick up their order</div>
              </div>
              <div className="text-emerald-400 text-2xl shrink-0">→</div>
            </button>

            <button
              onClick={onDeliveryClick}
              className="w-full rounded-2xl bg-neutral-800/80 border-2 border-neutral-700/50 p-8 hover:bg-neutral-800 hover:border-emerald-500/50 transition-all active:scale-[0.98] flex items-center gap-6 group"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shrink-0">
                🚗
              </div>
              <div className="flex-1 text-left">
                <div className="text-2xl font-bold text-white mb-2">Delivery</div>
                <div className="text-sm text-neutral-300">We&apos;ll deliver to customer&apos;s address</div>
              </div>
              <div className="text-emerald-400 text-2xl shrink-0">→</div>
            </button>

            <button
              onClick={onDineInClick}
              className="w-full rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 p-8 hover:bg-emerald-500/30 hover:border-emerald-500/60 transition-all active:scale-[0.98] flex items-center gap-6 group"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shrink-0">
                🍽️
              </div>
              <div className="flex-1 text-left">
                <div className="text-2xl font-bold text-white mb-2">Dine-In</div>
                <div className="text-sm text-neutral-300">Customer dining at the restaurant</div>
              </div>
              <div className="text-emerald-400 text-2xl shrink-0">→</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

