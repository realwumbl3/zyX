export class FocusController {
    constructor() {
        this.default_focusuable = null;
        this.focused_module_ref = null;
        this.options = { redirect: null };
    }

    setApp(app) {
        this.app = app;
    }

    getFocusedModule() {
        const module = this.focused_module_ref?.deref();
        if (!module) return null;
        if (!module?.__focusable__ instanceof Focusable) {
            raise("Module is not binded with focusable class.");
            return null;
        }
        return module;
    }

    setRedirection(module) {
        this.options.redirect = module;
    }

    setFocus(module) {
        //// Module is already focused, call its unfocus method first.
        const prevModule = this.getFocusedModule();
        if (prevModule) prevModule.__unFocus__?.();
        //// setting null focus resets focus back to main default_focusuable.
        if (module === null) module = this.default_focusuable;
        //// If module asks to redirect to another module as its focus, do it.
        if (!module.__focusable__) {
            throw new Error("Module is not focusable class.");
        }
        module = module.__focusable__.redirect();
        //// Set new focus and call its focus method.
        this.focused_module_ref = new WeakRef(module);
        module.__focus__?.();
    }
}

export class Focusable {
    constructor(module) {
        this.module = module;
        this.focused = false;
        this.redirect_to = null;
    }

    redirect() {
        const module = this.redirect_to?.deref();
        if (!module) return this.module;
        return module;
    }

    setRedirection(module) {
        if (!module) this.redirect_to = null;
        this.redirect_to = new WeakRef(module);
    }

    focus() {
        this.focused = true;
    }

    unFocus() {
        this.focused = false;
    }
}
