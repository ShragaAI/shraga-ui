import { CircularProgress } from "@mui/material";

export default function LoadingScreen({ logo: LoadingLogoComponent }: { logo?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col gap-4 h-full justify-center items-center">
      {LoadingLogoComponent && (
        <LoadingLogoComponent />
      )}
      <CircularProgress />
    </div>
  );
}