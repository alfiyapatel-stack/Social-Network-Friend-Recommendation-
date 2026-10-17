import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import cytoscape from 'cytoscape';
import { ISOLATED_COLOR } from './algo';
import type { Net } from './algo';
import { avatarUri } from './avatar';

export interface GraphControls {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  relayout: () => void;
}

interface Props {
  net: Net;
  directed: boolean;
  meId: string;
  showDirect: boolean;
  showIndirect: boolean;
  showIsolated: boolean;
  selected: string[];
  pathIds: string[];
  onNodeTap: (id: string) => void;
  onBgTap: () => void;
  controls: MutableRefObject<GraphControls | null>;
}

const STYLE = [
  {
    selector: 'node',
    style: {
      width: 54,
      height: 54,
      shape: 'ellipse',
      'background-image': 'data(img)',
      'background-fit': 'cover',
      'background-color': '#FCE7EF',
      'border-width': 3,
      'border-color': 'data(color)',
      label: 'data(label)',
      'text-valign': 'bottom',
      'text-margin-y': 6,
      'font-size': 11,
      'font-weight': 600,
      color: '#6D1738',
      'text-background-color': '#FFF8F5',
      'text-background-opacity': 0.8,
      'text-background-padding': 2,
    },
  },
  { selector: 'node.isolated', style: { 'border-style': 'dashed', opacity: 0.85 } },
  { selector: 'node.me', style: { 'border-width': 7 } },
  { selector: 'node.sel', style: { 'border-width': 6, 'border-color': '#6D1738' } },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#E8A1B2',
      'curve-style': 'bezier',
      'target-arrow-color': '#8F244B',
      'arrow-scale': 1.1,
    },
  },
  { selector: 'edge[dir = 1]', style: { 'target-arrow-shape': 'triangle', 'line-color': '#D1688A' } },
  {
    selector: 'edge.indirect',
    style: { 'line-style': 'dashed', 'line-color': '#C98A3E', width: 1.5, opacity: 0.8, 'curve-style': 'unbundled-bezier', 'control-point-distances': [40], 'control-point-weights': [0.5] },
  },
  { selector: '.dim', style: { opacity: 0.18 } },
  { selector: 'node.hl', style: { 'border-width': 5 } },
  { selector: 'edge.hl', style: { 'line-color': '#8F244B', width: 3.5 } },
  { selector: 'node.path', style: { 'border-color': '#6D1738', 'border-width': 7, opacity: 1 } },
  { selector: 'edge.path', style: { 'line-color': '#6D1738', 'target-arrow-color': '#6D1738', width: 5, opacity: 1 } },
  { selector: '.hidden', style: { display: 'none' } },
];

export default function GraphView({
  net,
  directed,
  meId,
  showDirect,
  showIndirect,
  showIsolated,
  selected,
  pathIds,
  onNodeTap,
  onBgTap,
  controls,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const handlers = useRef({ onNodeTap, onBgTap });
  handlers.current = { onNodeTap, onBgTap };

  // Create the Cytoscape instance once.
  useEffect(() => {
    if (!box.current) return;
    const cy = cytoscape({
      container: box.current,
      style: STYLE as unknown as cytoscape.StylesheetJson,
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });
    cyRef.current = cy;
    cy.on('tap', 'node', (e) => handlers.current.onNodeTap(e.target.id()));
    cy.on('tap', (e) => {
      if (e.target === cy) handlers.current.onBgTap();
    });
    cy.on('mouseover', 'node', (e) => {
      const nh = e.target.closedNeighborhood();
      cy.elements().not(nh).addClass('dim');
      nh.addClass('hl');
    });
    cy.on('mouseout', 'node', () => cy.elements().removeClass('dim hl'));
    controls.current = {
      zoomIn: () =>
        cy.zoom({ level: cy.zoom() * 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }),
      zoomOut: () =>
        cy.zoom({ level: cy.zoom() / 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }),
      fit: () => cy.fit(undefined, 40),
      relayout: () =>
        cy
          .layout({
            name: 'cose',
            animate: true,
            animationDuration: 500,
            randomize: true,
            fit: true,
            padding: 40,
            nodeRepulsion: () => 9000,
            idealEdgeLength: () => 80,
          } as cytoscape.LayoutOptions)
          .run(),
    };
    return () => {
      cy.destroy();
      cyRef.current = null;
      controls.current = null;
    };
  }, [controls]);

  // Rebuild elements whenever the network (or direction mode) changes.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const old = new Map<string, { x: number; y: number }>();
    cy.nodes().forEach((n) => {
      old.set(n.id(), { ...n.position() });
    });
    cy.elements().remove();

    const els: cytoscape.ElementDefinition[] = [];
    net.users.forEach((u, i) => {
      const comm = net.communities[net.commOf[i]];
      els.push({
        group: 'nodes',
        data: {
          id: u.id,
          label: u.name,
          img: avatarUri(u.name),
          color: comm.isolated ? ISOLATED_COLOR : comm.color,
        },
        classes: net.degree[i] === 0 ? 'isolated' : '',
        position: old.get(u.id) || { x: Math.random() * 500, y: Math.random() * 350 },
      });
    });
    const n = net.users.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!net.A[i][j]) continue;
        const a = net.ids[i];
        const b = net.ids[j];
        if (directed) {
          els.push({ group: 'edges', data: { id: `${a}->${b}`, source: a, target: b, dir: 1 } });
        } else if (net.A[j][i]) {
          if (i < j) els.push({ group: 'edges', data: { id: `${a}--${b}`, source: a, target: b, dir: 0 } });
        } else {
          els.push({ group: 'edges', data: { id: `${a}->${b}`, source: a, target: b, dir: 1 } });
        }
      }
    }
    cy.add(els);
    cy.layout({
      name: 'cose',
      animate: old.size > 0,
      animationDuration: 500,
      randomize: old.size === 0,
      fit: true,
      padding: 40,
      nodeRepulsion: () => 9000,
      idealEdgeLength: () => 80,
    } as cytoscape.LayoutOptions).run();
  }, [net, directed]);

  // Apply view state: indirect edges, visibility toggles, selection and path highlight.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.edges('.indirect').remove();
      const mi = net.idx.get(meId);
      if (showIndirect && mi !== undefined) {
        const extra: cytoscape.ElementDefinition[] = [];
        net.users.forEach((u, j) => {
          if (j !== mi && net.R[mi][j] && !net.nb[mi].has(j)) {
            extra.push({
              group: 'edges',
              data: { id: `ind-${u.id}`, source: meId, target: u.id, dir: 0 },
              classes: 'indirect',
            });
          }
        });
        cy.add(extra);
      }
      cy.nodes().removeClass('me sel path hidden');
      cy.edges().removeClass('path hidden');
      cy.getElementById(meId).addClass('me');
      selected.forEach((id) => cy.getElementById(id).addClass('sel'));
      if (!showDirect) cy.edges().not('.indirect').addClass('hidden');
      if (!showIsolated) cy.nodes('.isolated').addClass('hidden');
      for (let k = 0; k < pathIds.length; k++) {
        cy.getElementById(pathIds[k]).addClass('path');
        if (k > 0) {
          const a = pathIds[k - 1];
          const b = pathIds[k];
          cy.edges()
            .filter((e) => {
              const s = e.source().id();
              const t = e.target().id();
              return !e.hasClass('indirect') && ((s === a && t === b) || (s === b && t === a));
            })
            .addClass('path');
        }
      }
    });
  }, [net, meId, showDirect, showIndirect, showIsolated, selected, pathIds, directed]);

  return <div ref={box} className="h-full w-full" />;
}
