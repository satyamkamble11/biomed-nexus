import React from 'react';

export default function KnowledgeGraph({ term, hasGene, hasCompound, trialsCount, litCount, onNodeClick }) {
  const width = 400;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  // Peripheral node positions
  const nodes = [
    { 
      id: 'gene', 
      label: 'Ensembl Gene', 
      sub: hasGene ? 'Found' : 'Not Loaded', 
      x: centerX - 120, 
      y: centerY - 60, 
      active: hasGene,
      color: '#6366f1' // Indigo
    },
    { 
      id: 'compound', 
      label: 'ChEMBL Molecule', 
      sub: hasCompound ? 'Found' : 'Not Loaded', 
      x: centerX + 120, 
      y: centerY - 60, 
      active: hasCompound,
      color: '#06b6d4' // Cyan
    },
    { 
      id: 'trials', 
      label: 'Clinical Trials', 
      sub: trialsCount > 0 ? `${trialsCount} Active` : 'None Found', 
      x: centerX - 90, 
      y: centerY + 80, 
      active: trialsCount > 0,
      color: '#10b981' // Emerald
    },
    { 
      id: 'lit', 
      label: 'PubMed Abstracts', 
      sub: litCount > 0 ? `${litCount} Articles` : 'None Found', 
      x: centerX + 90, 
      y: centerY + 80, 
      active: litCount > 0,
      color: '#a855f7' // Purple
    }
  ];

  return (
    <div className="knowledge-graph-container" style={{ textAlign: 'center' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="260px" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connection Lines */}
        {nodes.map(node => (
          <line
            key={`line-${node.id}`}
            x1={centerX}
            y1={centerY}
            x2={node.x}
            y2={node.y}
            stroke={node.active ? node.color : 'rgba(255,255,255,0.06)'}
            strokeWidth={node.active ? 2 : 1}
            strokeDasharray={node.active ? '5,5' : '0'}
            style={{
              transition: 'all 0.4s ease',
              animation: node.active ? 'dash 15s linear infinite' : 'none'
            }}
          />
        ))}

        {/* Central Search Node */}
        <g style={{ cursor: 'pointer' }} onClick={() => onNodeClick('center')}>
          <circle
            cx={centerX}
            cy={centerY}
            r={32}
            fill="var(--bg-secondary)"
            stroke="url(#accent-grad)"
            strokeWidth={3}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))',
              transition: 'all 0.3s ease'
            }}
            className="graph-center-node"
          />
          <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
          <text
            x={centerX}
            y={centerY + 4}
            fill="#fff"
            fontSize="10"
            fontWeight="800"
            textAnchor="middle"
            pointerEvents="none"
          >
            {term.toUpperCase().substring(0, 10)}
          </text>
        </g>

        {/* Peripheral Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onNodeClick(node.id)}
            className="graph-node-group"
          >
            <circle
              r={24}
              fill="rgba(13, 17, 39, 0.95)"
              stroke={node.active ? node.color : 'rgba(255,255,255,0.1)'}
              strokeWidth={node.active ? 2.5 : 1}
              style={{
                filter: node.active ? `drop-shadow(0 0 6px ${node.color}44)` : 'none',
                transition: 'all 0.3s'
              }}
            />
            {/* Small icon center indicator */}
            <circle
              r={4}
              fill={node.active ? node.color : 'rgba(255,255,255,0.2)'}
              style={{ transition: 'all 0.3s' }}
            />
            {/* Label texts */}
            <text
              y={38}
              fill="#f1f5f9"
              fontSize="10.5"
              fontWeight="600"
              textAnchor="middle"
              pointerEvents="none"
            >
              {node.label}
            </text>
            <text
              y={50}
              fill={node.active ? node.color : 'var(--text-muted)'}
              fontSize="8.5"
              fontWeight="500"
              textAnchor="middle"
              pointerEvents="none"
            >
              {node.sub}
            </text>
          </g>
        ))}
      </svg>
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .graph-node-group:hover circle {
          transform: scale(1.1);
          filter: drop-shadow(0 0 10px var(--accent-primary)) !important;
        }
        .graph-center-node:hover {
          transform: scale(1.08);
        }
      `}</style>
    </div>
  );
}
