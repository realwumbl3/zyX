/**
 * Controller class for managing focusable modules in the application.
 * Handles focus state transitions and redirections between focusable modules.
 */
export class FocusController {
    /**
     * Creates a new FocusController instance.
     * @param {Object} defaultFocusable - The default module to focus when no other module is focused
     */
    constructor(defaultFocusable) {
        this.defaultFocusable = defaultFocusable;
        this.focusedModuleRef = null;
    }

    /**
     * Gets the currently focused module.
     * @returns {Object|null} The currently focused module or null if no module is focused
     * @throws {Error} If the focused module is not properly bound with Focusable
     */
    getFocusedModule() {
        const module = this.focusedModuleRef?.deref();
        if (!module) return null;
        if (!(module.__focusable__ instanceof Focusable)) {
            throw new Error("Module is not bound with Focusable class.");
        }
        return module;
    }

    /**
     * Sets the default focusable module.
     * @param {Object} module - The module to set as default focusable
     * @throws {Error} If the module is not a Focusable instance
     */
    setDefaultFocusable(module) {
        if (!(module.__focusable__ instanceof Focusable)) {
            throw new Error("Module is not a Focusable instance.");
        }
        this.defaultFocusable = module;
    }

    /**
     * Sets focus to the specified module.
     * @param {Object|null} module - The module to focus, or null to reset to default
     * @throws {Error} If the module is not a Focusable instance
     */
    setFocus(module) {
        // Unfocus current module if exists
        const prevModule = this.getFocusedModule();
        if (prevModule) {
            prevModule.__focusable__.unFocus();
        }

        // Reset to default if null
        if (module === null) {
            module = this.defaultFocusable;
        }

        // Validate module is focusable
        if (!(module.__focusable__ instanceof Focusable)) {
            throw new Error("Module is not a Focusable instance.");
        }

        // Handle redirection if needed
        const targetModule = module.__focusable__.redirect();

        // Set new focus
        this.focusedModuleRef = new WeakRef(targetModule);
        targetModule.__focusable__.focus();
    }
}

/**
 * Base class for focusable modules.
 * Provides focus state management and redirection capabilities.
 */
export class Focusable {
    /**
     * Creates a new Focusable instance.
     * @param {Object} module - The module to make focusable
     */
    constructor(module) {
        this.module = module;
        this.focused = false;
        this.redirectTo = null;
    }

    /**
     * Handles focus redirection.
     * @returns {Object} The target module after redirection
     */
    redirect() {
        const module = this.redirectTo?.deref();
        return module || this.module;
    }

    /**
     * Sets a redirection target for this focusable.
     * @param {Object|null} module - The module to redirect to, or null to clear redirection
     */
    setRedirection(module) {
        this.redirectTo = module ? new WeakRef(module) : null;
    }

    /**
     * Sets the focus state to focused.
     */
    focus() {
        this.focused = true;
    }

    /**
     * Sets the focus state to unfocused.
     */
    unFocus() {
        this.focused = false;
    }
}
