import os

def export_project():
    root_dir = r"c:\Users\user\app_quanlychdv"
    output_file = os.path.join(root_dir, "project_summary_for_claude.md")
    
    include_exts = {".js", ".jsx", ".css", ".json", ".rules", ".html", ".md"}
    exclude_dirs = {"node_modules", "dist", ".git", ".firebase", "assets", "plans", "docs"}
    
    # Specific files from root
    root_files = [
        "package.json", 
        "vite.config.js", 
        "firebase.json", 
        "firestore.rules",
        "index.html",
        "ROADMAP.md",
        "USER_MANUAL.md",
        "README.md",
        "FIREBASE_SETUP.md"
    ]

    with open(output_file, "w", encoding="utf-8") as out:
        out.write("# Project Summary\n\n")
        
        # Write root files
        for f in root_files:
            file_path = os.path.join(root_dir, f)
            if os.path.exists(file_path):
                out.write(f"## {f}\n```\n")
                with open(file_path, "r", encoding="utf-8") as inp:
                    out.write(inp.read())
                out.write("\n```\n\n")
        
        # Write src files
        src_dir = os.path.join(root_dir, "src")
        for root, dirs, files in os.walk(src_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                ext = os.path.splitext(f)[1]
                if ext in include_exts:
                    file_path = os.path.join(root, f)
                    rel_path = os.path.relpath(file_path, root_dir)
                    out.write(f"## {rel_path.replace(os.sep, '/')}\n```\n")
                    try:
                        with open(file_path, "r", encoding="utf-8") as inp:
                            out.write(inp.read())
                    except Exception as e:
                        out.write(f"Error reading file: {e}")
                    out.write("\n```\n\n")
                    
    print(f"Exported to {output_file}")

if __name__ == '__main__':
    export_project()
