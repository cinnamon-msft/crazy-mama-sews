# 🧵 Crazy Mama Sews - Quilt Tracker

A simple, easy-to-use website for tracking quilt projects. Keep track of completed quilts, works in progress, and upcoming projects with due dates.

## Features

✨ **Easy Project Management**
- Add new quilt projects with just a few clicks
- Upload photos of your quilts
- Track project status (Completed, In Progress, Due Soon)
- Add descriptions and due dates
- Edit or delete projects anytime
- Mark quilts as charity projects
- Favorite quilts and view them in a Favorites tab
- See thumbnail previews in the Manage Projects list

🎨 **Beautiful Gallery View**
- Browse all your quilts in a visual gallery
- Filter by status to find specific projects
- Click any quilt to see full details

📱 **Works Everywhere**
- Desktop, tablet, and mobile friendly
- No internet connection required after initial load
- All data stored locally in your browser

## How to Use

### Getting Started

1. **Open the website**: Simply open `index.html` in any web browser (Chrome, Firefox, Safari, Edge)
2. **Your data is automatically saved**: Everything you add is stored in your browser

### Adding a New Quilt

1. Click the **"Manage Projects"** tab at the top
2. Click the **"+ New Quilt"** button
3. Fill in the details:
   - **Project Name**: Give your quilt a name (required)
   - **Status**: Choose Completed, In Progress, or Due Soon
   - **Charity Quilt**: Mark if the quilt is for donation (optional)
   - **Favorite**: Add it to your favorites list (optional)
   - **Notes**: Add any details about the quilt
   - **Due Date**: Set a deadline (optional)
   - **Upload Photo**: Click "Choose File" to add a photo
4. Click **"Save Project"**

### Viewing Your Quilts

1. Click the **"Browse Quilts"** tab
2. Use the filter buttons (All, Completed, In Progress, Due Soon) to organize your view
3. Click on any quilt card to see full details
4. Use the **"Charity Quilts"** and **"Favorites"** tabs to view those lists

### Editing a Quilt

1. Go to the **"Manage Projects"** tab
2. Find the quilt you want to edit
3. Click the **"Edit"** button
4. Make your changes
5. Click **"Save Project"**

### Deleting a Quilt

1. Go to the **"Manage Projects"** tab
2. Find the quilt you want to delete
3. Click the **"Delete"** button
4. Confirm the deletion

## Deployment Options

### Option 1: Local Use (Easiest)
Just double-click the `index.html` file to open it in your browser. Bookmark the page for easy access.

### Option 2: GitHub Pages (Free Hosting)
1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select the branch (usually `main` or `master`)
4. Click "Save"
5. Your site will be available at: `https://[username].github.io/crazy-mama-sews/`

### Option 3: Other Free Hosting Services
You can also deploy to:
- **Netlify**: Drag and drop the files at netlify.com
- **Vercel**: Connect your GitHub repository
- **Cloudflare Pages**: Similar to GitHub Pages

## Technical Details

- **No Installation Required**: Pure HTML, CSS, and JavaScript
- **No Database Needed**: Uses browser localStorage
- **No Server Required**: Runs entirely in the browser
- **Image Storage**: Photos are stored as base64 in localStorage
- **Browser Support**: Works in all modern browsers

## Data Backup

Your quilt data is stored in your browser's localStorage. To backup your data:

1. Open the browser's Developer Console (F12)
2. Go to the "Application" or "Storage" tab
3. Find "Local Storage"
4. Look for the `crazymama_quilts` key
5. Copy the value and save it to a text file

To restore:
1. Open Developer Console
2. Go to "Console" tab
3. Type: `localStorage.setItem('crazymama_quilts', 'PASTE_YOUR_BACKUP_HERE')`
4. Refresh the page

## Tips

- **Regular Backups**: Save a backup of your data periodically
- **Photo Size**: Keep photo files under 5MB for best performance
- **Browser Storage**: Most browsers allow 5-10MB of localStorage
- **Multiple Devices**: To use on multiple devices, you'll need to manually backup and restore data, or use a hosting service

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

## License

Free to use for personal projects.

---

Made with ❤️ for quilting enthusiasts
