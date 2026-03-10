import React from 'react';

interface BossBarProps {
  title: string;
  percentage?: number; // 0 to 100
  color?: 'pink' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'white';
}

export const BossBar: React.FC<BossBarProps> = ({ 
  title, 
  percentage = 100, 
  color = 'pink' // Default to dragon pink/purple
}) => {
  
  // Minecraft Boss Bar Colors
  const colors = {
    pink:   { bar: '#f024b8', shadow: '#b11686', bg: '#490437' }, // Ender Dragon
    blue:   { bar: '#169c9d', shadow: '#0e6667', bg: '#062626' }, // Wither (blue phase)
    red:    { bar: '#dd2e2e', shadow: '#931e1e', bg: '#410909' }, // Raid
    green:  { bar: '#3fc23f', shadow: '#277e27', bg: '#0e2f0e' },
    yellow: { bar: '#f3f33a', shadow: '#a9a924', bg: '#44440c' },
    purple: { bar: '#a900f0', shadow: '#640096', bg: '#33004d' },
    white:  { bar: '#fbfbfb', shadow: '#a8a8a8', bg: '#424242' }
  };

  const selectedColor = colors[color] || colors.pink;

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 400, 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      fontFamily: 'monospace',
      zIndex: 100
    }}>
      {/* Title */}
      <div style={{
        color: selectedColor.bar, // Use the bar color for the text
        textShadow: '2px 2px 0 #220022', // Darker shadow for purple text contrast
        fontSize: '16px',
        marginBottom: 5,
        fontWeight: 'bold',
        letterSpacing: 1,
        textAlign: 'center',
        whiteSpace: 'nowrap'
      }}>
        {title}
      </div>

      {/* Bar Container */}
      <div style={{
        width: '100%',
        height: 12, // slightly taller
        position: 'relative',
        backgroundColor: '#555', // Outer rim color (greyish)
        // Simulate pixel border with box-shadow instead of border to control thickness
        boxShadow: 'inset 2px 2px 0 #373737, inset -2px -2px 0 #fff', // Bevel effect
        border: '2px solid #000', // Black outline
      }}>
          
        {/* Background (Empty part) */}
        <div style={{
            position: 'absolute',
            top: 2, left: 2, right: 2, bottom: 2,
            backgroundColor: selectedColor.bg, // Dark colored background
        }}></div>

        {/* Filled Bar */}
        <div style={{
            position: 'absolute',
            top: 2, 
            left: 2,
            bottom: 2,
            width: `calc(${percentage}% - 4px)`,
            backgroundColor: selectedColor.bar,
            // Add horizontal striations texture
            backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 4px,
                ${selectedColor.shadow} 4px,
                ${selectedColor.shadow} 8px
            )`, 
            boxShadow: `inset 0 2px 0 ${selectedColor.bar}80` // Highlight top
        }}></div>

        {/* Notches (6 notches for standard boss bar usually) */}
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${(100 / 6) * i}%`,
                width: 2,
                backgroundColor: '#222',
                zIndex: 2,
                opacity: 0.5
            }}></div>
        ))}
      </div>
    </div>
  );
};
