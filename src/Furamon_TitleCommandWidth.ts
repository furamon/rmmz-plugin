/*:
 * @target MV MZ
 * @plugindesc タイトルコマンドの横幅
 * @author Furamon
 * @param CommandWidth
 *   @desc コマンドの横幅
 *    @type number
 *    @default 240
 */

(() => {
  var parameters = PluginManager.parameters("Furamon_TitleCommandWidth");
  var param_CommandWidth = Number(parameters.CommandWidth || 240);
  Scene_Title.prototype.mainCommandWidth = () => param_CommandWidth;
})();
