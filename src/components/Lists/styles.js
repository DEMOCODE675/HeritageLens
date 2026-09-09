import { makeStyles } from 'tss-react/mui';

export default makeStyles()((theme) => ({
  formControl: {
    margin: theme.spacing(1), minWidth: 120, marginBottom: '30px',
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  loading: {
    height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  container: {
    padding: '16px',
    background: '#f6f8fb',
  },
  heading: {
    fontSize: '1.05rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  marginBottom: {
    marginBottom: '30px',
  },
  list: {
    height: '75vh', overflow: 'auto',
  },
}));