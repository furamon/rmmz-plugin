//------------------------------------------------------------------------------
// Furamon_AdditionalClassesPatch.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------

/*:
 * @target MV MZ
 * @plugindesc AdditionalClassesとAbilitySystemの競合回避パッチ
 * @author Furamon
 * @base NRP_AdditionalClasses
 * @orderAfter NRP_AdditionalClasses
 * @orderAfter NRP_AdditionalCCScene
 * @base AbilitySystem
 * @orderAfter AbilitySystem
 * @help NRP_AdditionalClasses.js、NRP_AdditionalCCScene.js、AbilitySystem.jsのあとに置いてください。
 *
 * AdditionalClassesとAbilitySystemの競合回避パッチです。
 * 追加職業のレベルアップでアビリティスキルを習得時、
 * 習得の表示がされない不具合を修正します。
 */

(() => {
    let _lastSkills: any = [];

    const _AdditionalClass_changeExp = AdditionalClass.prototype.changeExp;
    AdditionalClass.prototype.changeExp = function (exp, show, index, difExp) {
        _lastSkills = this.actor().skills({ includeHasAbilitySkills: true });
        _AdditionalClass_changeExp.call(this, exp, show, index, difExp);
    };

    const _AdditionalClass_displayLevelUp =
        AdditionalClass.prototype.displayLevelUp;
    AdditionalClass.prototype.displayLevelUp = function (newSkills) {
        const _newSkills = this.actor()
            .skills({ includeHasAbilitySkills: true })
            .filter((skill: number) => !_lastSkills.includes(skill));
        _AdditionalClass_displayLevelUp.call(this, _newSkills);
    };
})();
