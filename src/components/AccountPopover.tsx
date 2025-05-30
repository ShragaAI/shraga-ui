import { useRef, useState } from "react";

import { Button, CircularProgress, IconButton, Popover } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import { useAuthContext } from "../contexts/AuthContext";
import { usePageAccess } from "../hooks/usePageAccess";

import Gravatar from "./Settings/Gravatar";

export default function AccountPopover() {
  const { user, appVersion, isLoading, logout } = useAuthContext();
  const { hasAccess } = usePageAccess();

  const [isOpen, setIsOpen] = useState(false);
  const [hasGravatar, setHasGravatar] = useState(false);

  const anchorEl = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <IconButton ref={anchorEl} onClick={() => setIsOpen(true)}>
        {!hasGravatar && <AccountCircleOutlinedIcon />}

        {user && (
          <Gravatar 
            email={user.display_name}
            onLoaded={() => setHasGravatar(true)}
            onError={() => setHasGravatar(false)}
          />
        )}
      </IconButton>
      <Popover
        open={isOpen}
        anchorEl={anchorEl.current}
        onClose={() => setIsOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: "250px",
            }
          }
        }}
      >
        <div className="p-2">
          {isLoading ? (
            <CircularProgress />
          ) : user ? (
            <div className="flex flex-col gap-2 py-1">
              <div className="text-xs text-gray-400 py-1 px-2">
                Version: {appVersion}
              </div>

              <div className="text-sm py-1 px-2">
                {user?.display_name}
              </div>

              {hasAccess?.analytics && (
                <a 
                  href="/analytics" 
                  className="p-2 hover:bg-primary-lt text-left text-sm dark:hover:bg-white dark:hover:bg-opacity-10"
                >
                  <p>Analytics</p>
                </a>
              )}
              
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
              >
                Log out
              </Button>
            </div>
          ) : (
            <Button variant="contained" size="small">
              Sign in
            </Button>
          )}
        </div>
      </Popover>
    </>
  );
}
