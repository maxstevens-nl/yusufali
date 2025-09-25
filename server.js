const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function getMimeType(pathname) {
  const ext = pathname.substring(pathname.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'text/plain';
}

async function serveStaticFile(pathname) {
  try {
    const file = Bun.file(`.${pathname}`);
    const exists = await file.exists();
    
    if (!exists) {
      return null;
    }
    
    const mimeType = getMimeType(pathname);
    
    return new Response(file, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    return null;
  }
}

Bun.serve({
  port: 3001,
  
  routes: {
    // Static assets
    "/styles.css": async () => {
      const file = Bun.file("./styles.css");
      return new Response(file, {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    },
    
    "/app.js": async () => {
      const file = Bun.file("./app.js");
      return new Response(file, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    },
    
    "/manifest.json": async () => {
      const file = Bun.file("./manifest.json");
      return new Response(file, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    },
    
    "/sw.js": async () => {
      const file = Bun.file("./sw.js");
      return new Response(file, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache"
        }
      });
    },
    
    "/favicon.png": async () => {
      const file = Bun.file("./favicon.png");
      return new Response(file, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    }
  },

  // Fallback handler for SPA routing and other requests
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Try to serve static files first
    if (pathname !== '/') {
      const staticResponse = await serveStaticFile(pathname);
      if (staticResponse) {
        return staticResponse;
      }
    }
    
    // For all other requests (including SPA routes), serve index.html
    const indexFile = Bun.file("./index.html");
    return new Response(indexFile, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
});

console.log("🚀 Server running on http://localhost:3001");