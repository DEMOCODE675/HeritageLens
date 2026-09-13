import { makeStyles } from 'tss-react/mui';
import { alpha } from '@mui/material/styles';

export default makeStyles()((theme) => ({
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 600,
        [theme.breakpoints.up('sm')]: {
            fontSize: '1.5rem',
        },
    },
    subtitle: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
            marginRight: theme.spacing(2),
        },
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'flex-start',
        [theme.breakpoints.up('sm')]: {
            width: 'auto',
            justifyContent: 'flex-end',
        },
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.25),
        },
        marginRight: 0,
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(2),
            width: 'auto',
        },
    },
    suggestions: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        zIndex: 1200,
        color: theme.palette.text.primary,
        maxHeight: 280,
        overflowY: 'auto',
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
        width: '100%',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '15ch',
            '&:focus': {
                width: '25ch',
            },
        },
    },
    navContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    navButton: {
        color: 'inherit',
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: theme.spacing(2),
        padding: theme.spacing(0.5, 1.5),
        '&:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.2),
        },
    },
    activeNavButton: {
        backgroundColor: alpha(theme.palette.common.white, 0.28),
        color: '#fff',
        fontWeight: 700,
        '&:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.38),
        },
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
}));