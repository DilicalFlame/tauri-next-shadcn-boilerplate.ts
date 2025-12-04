type WindowType = "main" | "aux" | "child";

interface ICategoryState {
    /**
     * x is the distance in pixels from the left edge of the screen to the left edge of the window
     */
    x: number;
    /**
     * y is the distance in pixels from the top edge of the screen to the top edge of the window
     */
    y: number;
    /**
     * width is the width of the window in pixels
     */
    width: number;
    /**
     * height is the height of the window in pixels
     */
    height: number;
    /**
     * maximized indicates whether the window is currently maximized
     */
    maximized: boolean;
}

interface IActiveWindow {
    type: WindowType;
    /**
     * category is the category name of the window (e.g., "settings", "dialog")
     */
    category: string;
    /**
     * url is the URL or path of the page loaded in the window
     */
    url: string;
}

interface IWorkspace {
    /**
     * active_windows maps window labels to their type, category, and url
     */
    active_windows: Record<string, IActiveWindow>;
    /**
     * states maps category names to their saved position, size etc
     */
    states: Record<string, ICategoryState>; // category_name -> position/size
}

interface IAppState {
    workspaces: Record<string, IWorkspace>; // workspace_id -> workspace state
}

interface IWindowConfig {
    url: string;
    title: string;
    width: number;
    height: number;
    resizable: boolean;
    decorations: boolean;
    visible: boolean;
    parent: string;
    skipTaskbar: boolean;
    center: boolean;
    minimizable: boolean;
    x: number;
    y: number;
    maximized: boolean;
    label: string;
    category: string; // New field for window category
}
