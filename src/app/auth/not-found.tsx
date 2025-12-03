export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">404</h2>
                <p className="text-muted-foreground mb-6">Page not found</p>
                <a href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block">
                    Go Home
                </a>
            </div>
        </div>
    );
}
