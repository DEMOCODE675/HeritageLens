import { makeStyles } from 'tss-react/mui';

export default makeStyles()(() => ({
  paper: {
    padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '180px',
  },
  mapContainer: {
    height: '85vh', width: '100%',
  },
  markerContainer: {
    position: 'absolute', transform: 'translate(-50%, -50%)', zIndex: 1, '&:hover': { zIndex: 2 },
  },
  pointer: {
    cursor: 'pointer', width: '150px', height: '80px', objectFit: 'cover', borderRadius: '4px',
  },
  markerStyles: {
    '& :global(.place-marker-icon)': {
      background: 'transparent',
      border: 0,
    },
    '& :global(.place-marker-card)': {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      width: '96px',
      height: '34px',
      padding: '3px',
      boxSizing: 'border-box',
      background: '#fff',
      border: '1px solid #d7dee8',
      borderRadius: '6px',
      boxShadow: '0 1px 5px rgba(15, 23, 42, 0.24)',
    },
    '& :global(.place-marker-image)': {
      width: '28px',
      height: '28px',
      flexShrink: 0,
      objectFit: 'cover',
      borderRadius: '4px',
    },
    '& :global(.place-marker-name)': {
      overflow: 'hidden',
      color: '#172033',
      fontSize: '9px',
      fontWeight: 600,
      lineHeight: 1.2,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
  },
}));