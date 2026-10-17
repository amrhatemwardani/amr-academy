export function SproutIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Sun top-right */}
      <g className="animate-spin" style={{ animationDuration: '30s', transformOrigin: '275px 55px' }}>
        <circle cx="275" cy="55" r="22" fill="#FEC038" />
        {/* Sun rays */}
        <line x1="275" y1="22" x2="275" y2="28" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="275" y1="82" x2="275" y2="88" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="242" y1="55" x2="248" y2="55" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="302" y1="55" x2="308" y2="55" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="252" y1="32" x2="256" y2="36" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="294" y1="74" x2="298" y2="78" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="252" y1="78" x2="256" y2="74" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
        <line x1="294" y1="36" x2="298" y2="32" stroke="#FEC038" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Cloud top-left */}
      <g opacity="0.95">
        <path
          d="M60 70C60 63.3726 65.3726 58 72 58C73.4 58 74.74 58.24 75.98 58.68C78.43 53.48 83.74 50 89.8 50C97.64 50 104 56.36 104 64.2C106.35 64.71 108 66.8 108 69.3C108 72.45 105.45 75 102.3 75H65C62.24 75 60 72.76 60 70Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Sparkles (4-point stars) */}
      <path
        d="M68 140C68 140 70 144 74 144C70 144 68 148 68 148C68 148 66 144 62 144C66 144 68 140 68 140Z"
        fill="#F45B78"
      />
      <path
        d="M280 148C280 148 282 152 286 152C282 152 280 156 280 156C280 156 278 152 274 152C278 152 280 148 280 148Z"
        fill="#F45B78"
      />

      {/* Oval Ground Shadow under pot */}
      <ellipse cx="170" cy="265" rx="72" ry="10" fill="#E8C8B8" />

      {/* Watering Can on the left */}
      <g>
        {/* Can body */}
        <path
          d="M64 218H86L82 248H68L64 218Z"
          fill="#4E80E6"
        />
        {/* Handle */}
        <path
          d="M64 222C56 222 54 238 66 244"
          stroke="#4E80E6"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Spout */}
        <path
          d="M84 226L102 216"
          stroke="#4E80E6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Spout rose/sprinkler head */}
        <ellipse cx="103" cy="215" rx="2.5" ry="5" fill="#4E80E6" transform="rotate(-30 103 215)" />

        {/* Water drops */}
        <circle cx="108" cy="222" r="1.8" fill="#4E80E6" opacity="0.8" />
        <circle cx="114" cy="227" r="1.8" fill="#4E80E6" opacity="0.8" />
        <circle cx="111" cy="233" r="1.5" fill="#4E80E6" opacity="0.6" />
      </g>

      {/* Potted Plant */}
      <g>
        {/* Plant Stem & Leaves */}
        {/* Center stem */}
        <path
          d="M170 190V130"
          stroke="#2C8C5C"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Center top leaf */}
        <path
          d="M170 132C160 105 170 82 170 82C170 82 180 105 170 132Z"
          fill="#2C8C5C"
        />
        {/* Left top leaf */}
        <path
          d="M168 140C140 125 128 135 128 135C128 135 144 152 168 144Z"
          fill="#2C8C5C"
        />
        {/* Right top leaf */}
        <path
          d="M172 140C200 125 212 135 212 135C212 135 196 152 172 144Z"
          fill="#2C8C5C"
        />
        {/* Left bottom leaf */}
        <path
          d="M168 165C135 160 125 175 125 175C125 175 145 186 168 172Z"
          fill="#34A86F"
        />
        {/* Right bottom leaf */}
        <path
          d="M172 165C205 160 215 175 215 175C215 175 195 186 172 172Z"
          fill="#34A86F"
        />

        {/* Pot Body (Trapezoid) */}
        <path
          d="M132 195L140 260H200L208 195H132Z"
          fill="#F37A5B"
        />
        {/* Pot Rim */}
        <rect
          x="126"
          y="185"
          width="88"
          height="14"
          rx="5"
          fill="#EB6744"
        />

        {/* Cute Face on the Pot */}
        {/* Left Eye */}
        <circle cx="155" cy="226" r="4" fill="#222222" />
        <circle cx="156.5" cy="224.5" r="1.3" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="185" cy="226" r="4" fill="#222222" />
        <circle cx="186.5" cy="224.5" r="1.3" fill="#FFFFFF" />

        {/* Rosy Cheeks */}
        <ellipse cx="148" cy="232" rx="4" ry="2.5" fill="#FF9B85" opacity="0.8" />
        <ellipse cx="192" cy="232" rx="4" ry="2.5" fill="#FF9B85" opacity="0.8" />

        {/* Happy Smiling Mouth */}
        <path
          d="M165 234C167 238 173 238 175 234"
          stroke="#222222"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  )
}
