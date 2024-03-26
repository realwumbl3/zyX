// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX from  "../../";
// #endregion
export default function ClickOrTwo(element, {
    single,
    double,
    doubleWait = false,
    cooldown,
    cooldownDuration = 350
} = {}, {
    active_fuse = this.returnFuse(),
    db_fuse = this.returnFuse()
} = {}) {
    this.on(element).clickOne(({ dwn_e, up_e }) => {
        if (cooldown) return;
        if (active_fuse.true) return db_fuse.True();
        zyX({}).delay("click", doubleWait || this.clickOrTwoWindowMs, () => {
            active_fuse.reset()
            db_fuse.falseTrue(
                _ => single(dwn_e),
                _ => {
                    double(dwn_e);
                    cooldown = setTimeout(() => cooldown = null, cooldownDuration);
                }
            )
            db_fuse.reset()
        })
        active_fuse.True();
    })
}