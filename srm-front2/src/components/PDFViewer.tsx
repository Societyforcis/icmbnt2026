import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';


pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


interface PDFViewerProps {
    pdfUrl: string;
    title?: string;
}


const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, title }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);


    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    
    const onDocumentLoadError = (error: Error) => {
        console.error('PDF Load Error:', error);
        setLoading(false);
    };

    const handleZoom = (delta: number) => {
        setZoom((prev) => Math.max(50, Math.min(200, prev + delta)));
    };

    const toggleFullscreen = () => {
        const element = document.getElementById('pdf-viewer-container');
        if (!isFullscreen && element) {
            element.requestFullscreen().catch((err) => {
                console.error('Fullscreen error:', err);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const goToPage = (page: number) => {
        if (numPages && page >= 1 && page <= numPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="pdf-viewer-wrapper">
            {title && (
                <div className="pdf-viewer-header">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                </div>
            )}

            <div
                id="pdf-viewer-container"
                className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}
            >
                {/* Controls */}
                <div className="pdf-controls bg-gray-100 border-b border-gray-300 p-3 flex justify-between items-center sticky top-0 z-10">
                    {/* Navigation Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition"
                            title="Previous Page"
                        >
                            ◀ Prev
                        </button>

                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                min={1}
                                max={numPages || 1}
                            />
                            <span className="text-gray-600">/ {numPages || '?'}</span>
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={!numPages || currentPage >= numPages}
                            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition"
                            title="Next Page"
                        >
                            Next ▶
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleZoom(-10)}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                            title="Zoom Out"
                        >
                            🔍−
                        </button>
                        <span className="text-gray-700 font-medium min-w-[60px] text-center">{zoom}%</span>
                        <button
                            onClick={() => handleZoom(10)}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                            title="Zoom In"
                        >
                            🔍+
                        </button>
                        <button
                            onClick={() => setZoom(100)}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                            title="Reset Zoom"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Fullscreen Toggle */}
                    <div>
                        <button
                            onClick={toggleFullscreen}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? "⛶ Exit" : "⛶ Full"}
                        </button>
                    </div>
                </div>

                {/* PDF Display Area */}
                <div className="pdf-display-area bg-gray-200 overflow-auto flex justify-center items-start p-4" style={{ minHeight: '600px' }}>
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading PDF...</p>
                            </div>
                        </div>
                    )}

                    <div
                        className="pdf-document-wrapper bg-white shadow-lg"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading PDF...</p>
                                </div>
                            }
                            error={
                                <div className="p-8 text-center">
                                    <p className="text-red-600 font-semibold mb-2">Failed to load PDF</p>
                                    <p className="text-gray-600 text-sm">Please ensure the file is a valid PDF and accessible.</p>
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Open in New Tab
                                    </a>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={currentPage}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                        </Document>
                    </div>
                </div>

                {/* Page Info Footer */}
                <div className="pdf-footer bg-gray-100 border-t border-gray-300 p-2 text-center text-sm text-gray-600">
                    Page {currentPage} of {numPages || '?'} • Zoom: {zoom}%
                </div>
            </div>

            <style>{`
        .pdf-viewer-wrapper {
          width: 100%;
          max-width: 100%;
        }

        .pdf-viewer-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .pdf-viewer-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          border-radius: 0;
        }

        .pdf-display-area {
          max-height: 70vh;
        }

        .pdf-viewer-container.fullscreen .pdf-display-area {
          max-height: calc(100vh - 120px);
        }

        .pdf-document-wrapper {
          display: inline-block;
        }

        .react-pdf__Page {
          max-width: 100%;
        }

        .react-pdf__Page__canvas {
          max-width: 100%;
          height: auto !important;
        }

        .react-pdf__Page__textContent {
          max-width: 100%;
        }

        .react-pdf__Page__annotations {
          max-width: 100%;
        }
      `}</style>
        </div>
    );
};

export default PDFViewer;
