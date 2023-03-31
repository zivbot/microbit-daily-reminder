input.onButtonPressed(Button.A, function () {
    if (mode == 0) {
        // set hours
        hours += -1
        if (hours < 0) {
            hours = 23
        }
        basic.showNumber(hours, textSpeed)
        
    } else if (mode == 1) {
        // set minutes
        minutes -= 1
        if (minutes < 0) {
            minutes += 60
        }
        basic.showNumber(Math.floor(minutes), textSpeed * 0.7)
    } else if (mode == 2) {
        // set alert hour
        alertHour -= 1
        if (alertHour < 0) {
            alertHour = 23
        }
        basic.showNumber(alertHour,textSpeed)
    }
})
input.onButtonPressed(Button.B, function () {
    if (mode == 0) {
        // set hours
        hours += 1
        if (hours > 23) {
            hours = 0
        }
        basic.showNumber(hours, textSpeed)
    } else if (mode == 1) {
        // set minutes
        minutes += 1
        if (minutes > 60) {
            minutes += 0 - 60
        }
        basic.showNumber(Math.floor(minutes), textSpeed*0.7)
    }
    else if (mode == 2) {
        // set alert hours
        alertHour += 1
        if (alertHour > 23) {
            alertHour = 0
        }
        basic.showNumber(alertHour, textSpeed)
    }
})
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (mode == 0) {
        basic.showString("SET M", textSpeed)
        basic.showNumber(Math.floor(minutes), textSpeed)
        // change mode
        mode = 1
    } else if (mode == 1) {
        basic.showString("SET ALERT", textSpeed)
        basic.showNumber(alertHour, textSpeed)
        // change mode
        mode = 2
    } else if (mode == 2) {
        // in set alert mode
        // change mode
        mode = 3
        lastMillis = control.millis() // note the millis when clock started, use it to keep track
        basic.showIcon(IconNames.Happy)
        basic.pause(2000)
        basic.clearScreen()
    }
    if (mode == 3 && isAlertOn) {
        isAlertOn = false
        basic.showIcon(IconNames.Happy)
    }
})
input.onShake(function() {
    if (mode==3) displayTime()
})
input.onButtonPressed(Button.AB, function() {
    // if clicked A+B then go back to setting time and alert
    startSetup()
})

let alertHour = 15
let minutes = 0
let mode = 0
let hours = 8
let isAlertOn = false
let alertDuration = 0
const textSpeed = 60
let lastMillis = 0

startSetup()

function startSetup() {
    mode = 0
    isAlertOn = false
    basic.showString("SET H", 60)
    basic.showNumber(hours, textSpeed)
}

basic.forever(function () {
    
    if (mode == 3) {
        // if timer is on
        // wait one minute
        basic.pause(30000) // display time every 30s
        let currentMillis = control.millis()
        minutes += (control.millis() - lastMillis) / 60000
        lastMillis = control.millis()
        if (minutes >= 60) {
            minutes -= 60
            if (hours < 23) {
                hours += 1
            } else {
                hours = 0
            }
        }
        
        if (hours == alertHour && Math.floor(minutes) == 0 && !isAlertOn) {
            // trigger alert
            isAlertOn = true
            alertDuration = 0
        }

        
        if (isAlertOn) {
            alertDuration++
            
            basic.showLeds(`
                # # # # #
                # # # # #
                # # # # #
                # # # # #
                # # # # #
                `)
            if (alertDuration == 2) {
                soundAlert(1)
            } else if (alertDuration == 10) {
                    soundAlert(2)
            } else if (alertDuration > 10 && (alertDuration % 30 == 0) && hours > 8 && hours < 20) {
                // every half hour, but not during night
                soundAlert(3)
            }
        } else {
            // show time
            displayTime();
            
        }

        
        
    }
})

function displayTime() {
    let str = hours + ":"
    if (minutes < 10)
        str = str + "0"
    str = str + Math.floor(minutes)
    basic.showString(str,50)
}

function soundAlert( x : number ) {
    for (; x > 0; x-- ) {
        music.playTone(Note.C4, music.beat(BeatFraction.Eighth))
        music.playTone(Note.D4, music.beat(BeatFraction.Quarter))
    }
}
