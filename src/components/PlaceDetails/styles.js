import { makeStyles } from 'tss-react/mui';

export default makeStyles()(() => ({
  card: {
    marginBottom: '12px',
    overflow: 'hidden',
    border: '1px solid #e1e6ed',
    background: '#fff',
  },
  image: {
    height: '150px',
    objectFit: 'cover',
  },
  content: {
    padding: '10px 12px',
    '&:last-child': { paddingBottom: '10px' },
  },
  name: { fontWeight: 700, lineHeight: 1.2, marginBottom: '5px' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' },
  reviewText: { color: '#667085' },
  meta: {
    display: 'flex', alignItems: 'flex-start', gap: '4px', color: '#667085', lineHeight: 1.35, marginTop: '3px',
  },
  links: {
    display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11px', fontWeight: 700,
  },
}));