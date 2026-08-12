import Link from "next/link";

export default function GamingZonePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Hlavička */}
      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-widest text-purple-600 uppercase">
          Vyber si hru
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-purple-950 mt-2">
          Poď trénovať matematiku!
        </h1>
        <p className="text-purple-800/70 font-medium text-lg mt-3">
          Krátke hry, veľa energie a čísla, ktoré si zapamätáš.
        </p>
      </div>

      {/* Mriežka s 3 kartami vedľa seba */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        
        {/* 1. Karta: Meteorický dážď */}
        <Link 
          href="/meteoricky-dazd" 
          className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 p-6 flex flex-col justify-between hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
        >
          <div>
            <h3 className="text-2xl font-extrabold text-purple-950">Meteorický dážď</h3>
            <p className="text-purple-900/70 font-medium text-sm mt-1">
              Rozbíjaj meteory výsledkami
            </p>
          </div>
          <div className="mt-6 rounded-2xl overflow-hidden">
            <img 
              src="/talumi-meteor-game-card.png" 
              alt="Meteorický dážď" 
              className="w-full h-auto object-cover" 
            />
          </div>
        </Link>

        {/* 2. Karta: Energický had */}
        <Link 
          href="/energicky-had" 
          className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 p-6 flex flex-col justify-between hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
        >
          <div>
            <h3 className="text-2xl font-extrabold text-purple-950">Energický had</h3>
            <p className="text-purple-900/70 font-medium text-sm mt-1">
              Zbieraj čísla v sekvencii
            </p>
          </div>
          <div className="mt-6 rounded-2xl overflow-hidden">
            <img 
              src="/talumi-energy-snake-card.png" 
              alt="Energický had" 
              className="w-full h-auto object-cover" 
            />
          </div>
        </Link>

        {/* 3. Karta: Neónové bubliny */}
        <Link 
          href="/neon-bubbles" 
          className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 p-6 flex flex-col justify-between hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
        >
          <div>
            <h3 className="text-2xl font-extrabold text-purple-950">Neónové bubliny</h3>
            <p className="text-purple-900/70 font-medium text-sm mt-1">
              Priraď správny výsledok
            </p>
          </div>
          <div className="mt-6 rounded-2xl overflow-hidden">
            <img 
              src="/talumi-neon-bubbles-card.png" 
              alt="Neónové bubliny" 
              className="w-full h-auto object-cover" 
            />
          </div>
        </Link>

      </div>
    </div>
  );
}