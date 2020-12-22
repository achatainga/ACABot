import "normalize.css";
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Button, Toolbar, Typography } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

const useStyles = makeStyles( (theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  list: {
    width: 250,
  },
  fullList: {
    width: 'auto',
  },
}));

const TopMenu = () => {
  const classes = useStyles();

  const menuItems = [
    { id: "github", icon: <GitHubIcon />, label: "Github", onclick: () => window.open( "https://github.com/achatainga/ACABot" ) },
    { id: "invite", icon: <ExitToAppIcon />, label: "Invite bot to Discord", onclick: () => window.open( "https://discord.com/api/oauth2/authorize?client_id=789723522770927617&permissions=8192&scope=bot" ) },
  ]

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={ classes.title }>
            ACABot
          </Typography>
          { menuItems.map( ( menuItem, index ) =>
            <Button startIcon={menuItem.icon}color="inherit" key={ index } onClick={menuItem.onclick}>{ menuItem.label }</Button>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default TopMenu;