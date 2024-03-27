/**
 * animationHandlers.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */

declare global {
    interface HTMLElement {
        /** Returns true if a tile is directly below the element. */
        isDirectlyToTheBottomOf(tile: HTMLElement): boolean;
        /** Returns true if a tile is directly to the left of the element. */
        isDirectlyToTheLeftOf(tile: HTMLElement): boolean;
        /** Returns true if a tile is directly to the right of the element. */
        isDirectlyToTheRightOf(tile: HTMLElement): boolean;

        /** Returns true if a tile is placed on the X'th row below the element.
         * 
         * (Will return incorrect values for higher number of rows)
         * @param rows - The number of rows down.
         */
        isXRowsBelow(rows: number, tile: HTMLElement): boolean;
        /** Returns true if a tile is placed on the X'th column left of the element.
         * 
         * (Will return incorrect values for higher number of columns)
         * @param columns - The number of columns left.
         */
        isXColumnsLeftOf(columns: number, tile: HTMLElement): boolean;
        /** Returns true if a tile is placed on the X'th column right of the element.
         * 
         * (Will return incorrect values for higher number of columns)
         * @param columns - The number of columns right.
         */
        isXColumnsRightOf(columns: number, tile: HTMLElement): boolean;
    }
}

import { status_database } from "./dataStorage.js"
import { updateTile } from "./defaultDisplayElements.js"
import { getCookie } from "./defaultFunctions.js"



export const getTileAnimations = (kiosk: HTMLElement, urgencyLevel: number) => {
    if (getCookie("anims.tile.update_anims") === "false") return false;

    let availabeAnimations = [];

    availabeAnimations.push(testFall(kiosk));
    availabeAnimations.push(testPush_Walk(kiosk));
    availabeAnimations.push(testStomp(kiosk));
    availabeAnimations = availabeAnimations.filter(item => item !== false);

    if (availabeAnimations.length > 0) return availabeAnimations.flat();
}

export const getGlobalAnimations = () => {
    
}

export function playAnimation(tile: HTMLElement|string, animationId: string, args: any) {
    if (typeof tile === 'string') tile = document.getElementById(tile) as HTMLElement;

    switch (animationId.toUpperCase()) {
        case "NOD":
            break;
        case "FALL":
            playFall(tile);
            break;
        case "PUSH":
            playPush(tile, args.tileB, args.distance);
            break;
        case "STOMP":
            playStomp(tile, args.tileB);
            break;
        case "WALK":
            playWalk(tile, args.tileB);
            break;
    }
}



/** Plays the "Fall" animation.
 * @param tile - Tile to animate.
 */
export function playFall(tile: HTMLElement) {
    tile.classList.add('anim_fall');

    setTimeout(() => {
        tile.classList.add('anim_return');
        tile.classList.remove('anim_fall');
        updateTile(tile.id, status_database[tile.id].urgency_level)
    }, 4000);
    setTimeout(() => {
        tile.classList.remove('anim_return');
    }, 5000);
}

/** Plays the "Push" animation.
 * @param tile - Tile to animate.
 */
export function playPush(tile: HTMLElement, tileB: HTMLElement, distance: number) {
    tile.style.setProperty('--margin-left', distance + "px");
    tile.classList.add('anim_pushA');
    tileB.classList.add('anim_pushB');

    setTimeout(() => {
        tile.classList.add('anim_return');
        tile.classList.remove('anim_pushA');
        tileB.classList.remove('anim_pushB');
        updateTile(tile.id, status_database[tile.id].urgency_level)
    }, 5000);
    setTimeout(() => {
        tile.classList.remove('anim_return');
    }, 6000);
}

/** Plays the "Stomp" animation.
 * @param tile - Tile to animate.
 */
export function playStomp(tile: HTMLElement, tileB: HTMLElement) {
    tile.classList.add('stomp_pushA');
    tileB.classList.add('stomp_pushB');

    setTimeout(() => {
        updateTile(tile.id, status_database[tile.id].urgency_level)
    }, 1700);
    setTimeout(() => {
        tile.classList.remove('anim_stompA');
        tileB.classList.remove('anim_stompB');
    }, 2000);
}

/** Plays the "Push" animation.
 * @param tile - Tile to animate.
 */
export function playWalk(tile: HTMLElement, distance: number) {
    tile.style.setProperty('--margin-left', distance + "px");
    tile.classList.add('anim_walk');

    setTimeout(() => {
        tile.classList.add('anim_return');
        tile.classList.remove('anim_walk');
        updateTile(tile.id, status_database[tile.id].urgency_level)
    }, 5000);
    setTimeout(() => {
        tile.classList.remove('anim_return');
    }, 6000);
}



/** Tests whether animation "Fall" can be played.
 * @param tile - Tile to animate.
 * @returns an object containing animation details or false.
 */
const testFall = (tile: HTMLElement) => {
    const group = tile.closest('.group');
    if (!group) return false;

    for (let element of group.querySelectorAll(`.kiosk:not(#${tile.id})`) as NodeListOf<HTMLElement>) {
        if (element.isDirectlyToTheBottomOf(tile)) return false;
    }

    return {id: "fall", args: null};
}

/** Tests whether animation "Push" can be played.
 * @param tile - Tile to animate.
 * @returns an object containing animation details or false.
 */
const testPush_Walk = (tile: HTMLElement) => {
    const group = tile.closest('.group');
    if (!group) return false;

    let maxInsetOfGround = 0,
        foundRowBelow = 0,
        foundTileLeft = null;
    let argList = [];

    for (let element of group.querySelectorAll(`.kiosk:not(#${tile.id})`) as NodeListOf<HTMLElement>) {
        if (element.isDirectlyToTheRightOf(tile)) return false;
        if (element.offsetTop > tile.offsetTop && (!foundRowBelow || element.offsetTop === foundRowBelow)) {
            foundRowBelow = element.offsetTop;
            maxInsetOfGround = Math.max(maxInsetOfGround, element.offsetLeft);
        }
        if (element.isDirectlyToTheLeftOf(tile) && element.isXColumnsLeftOf(1, tile)) foundTileLeft = element;
    }

    if (maxInsetOfGround < tile.offsetLeft) return false

    const distance = maxInsetOfGround - tile.offsetLeft + tile.offsetWidth + 15
    argList.push({id: "walk", args: {distance: distance}});
    if (foundTileLeft) argList.push({id: "push", args: {tileB: foundTileLeft, distance: distance}});

    return argList;
}

/** Tests whether animation "Stomp" can be played.
 * @param tile - Tile to animate.
 * @returns an object containing animation details or false.
 */
export const testStomp = (tile: HTMLElement) => {
    const group = tile.closest('.group');
    if (!group) return false;

    let elementB = null;

    for (let element of group.querySelectorAll(`.kiosk:not(#${tile.id})`) as NodeListOf<HTMLElement>) {
        if (!element.isDirectlyToTheBottomOf(tile)) continue;
        if (element.isXRowsBelow(1, tile)) return false;
        if (element.isXRowsBelow(2, tile)) elementB = element; 
    }

    if (!elementB) return false;

    return {id: "stomp", args: {tileB: elementB}};
}



/* Custom boolean values for HTMLElement interface. */
HTMLElement.prototype.isXRowsBelow = function(this: HTMLElement, rows: number, tile: HTMLElement) {return this.offsetTop > (tile.offsetTop + this.offsetHeight * rows) && this.offsetTop < (tile.offsetTop + tile.offsetHeight * (rows+1))}
HTMLElement.prototype.isXColumnsLeftOf = function(this: HTMLElement, columns: number, tile: HTMLElement) {return this.offsetLeft < (tile.offsetLeft - this.offsetWidth * columns) && this.offsetLeft > (tile.offsetLeft - tile.offsetWidth * (columns+1))}
HTMLElement.prototype.isXColumnsRightOf = function(this: HTMLElement, columns: number, tile: HTMLElement) {return this.offsetLeft > (tile.offsetLeft + this.offsetWidth * columns) && this.offsetLeft < (tile.offsetLeft + tile.offsetWidth * (columns+1))}
HTMLElement.prototype.isDirectlyToTheBottomOf = function(this: HTMLElement, tile: HTMLElement) {return this.offsetTop > tile.offsetTop && this.offsetLeft === tile.offsetLeft};
HTMLElement.prototype.isDirectlyToTheLeftOf = function(this: HTMLElement, tile: HTMLElement) {return this.offsetTop === tile.offsetTop && this.offsetLeft < tile.offsetLeft};
HTMLElement.prototype.isDirectlyToTheRightOf = function(this: HTMLElement, tile: HTMLElement) {return this.offsetTop === tile.offsetTop && this.offsetLeft > tile.offsetLeft};