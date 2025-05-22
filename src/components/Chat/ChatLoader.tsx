export default function ChatLoader() {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="flex h-[90%] w-full items-center justify-center bg-primary-lt/70 dark:bg-[#2e2e2e]/70 rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        </div>
    );
}