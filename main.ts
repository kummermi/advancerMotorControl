/*
I^2C Motorc Drivers
*/
//% weight=10 icon="\uf192" color=#ff5733 block="Advancer Motors" 
namespace advancerDrive {
    let MotorSpeedSet = 0x82
    let PWMFrequenceSet = 0x84
    let DirectionSet = 0xaa
    let MotorSetA = 0xa1
    let MotorSetB = 0xa5
    let Nothing = 0x01
    let EnableStepper = 0x1a
    let UnenableStepper = 0x1b
    let Stepernu = 0x1c
    let BothClockWise = 0x0a
    let BothAntiClockWise = 0x05
    let M1CWM2ACW = 0x06
    let M1ACWM2CW = 0x09
    let I2CMotorDriverAdd = 0x0d
    let electricMotorDirection = [0, 0]
    let electricMotorOutput = [0, 0]
    let DriverAddress = 0x0A


    // Maps a value from one range to another
    function mapValue(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number {
        return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    }


    function resetI2CDevices(){
        let reset_pin = DigitalPin.P1;
        pins.digitalWritePin(reset_pin, 1);
        basic.pause(50);
        pins.digitalWritePin(reset_pin, 0);
        basic.pause(250);
    }

    /**
     * Sets the speed of the motors
     * @param speed1
     * @param speed2
     */
    //% block="Setze die Geschwindigkeit für Motor 1 $speed1 und Motor 2 $speed2"
    //% speed1.min=-100 speed1.max=100
    //% speed2.min=-100 speed2.max=100
    //% speed1.defl=0
    //% speed2.defl=0
    export function setSpeed(speed1: number, speed2: number) {
        let s1 = mapValue(speed1, 0, 100, 0, 255);
        let s2 = mapValue(speed2, 0, 100, 0, 255);
        let buf = pins.createBuffer(3);
        buf[0] = MotorSpeedSet;
        buf[1] = s1;
        buf[2] = s2;
        pins.i2cWriteBuffer(DriverAddress, buf);
        basic.pause(20);
    }

    /**
     * Setze Leistung für beide Elektromotoren auf 0
     */
    //% block="Setze Leistung für alle Elektromotoren auf 0"
    export function zeroAllMotors() {
        electricMotorDirection = [0, 0]
        electricMotorOutput = [0, 0]
    }

    /**
     * Setze die Leistung für einen Elektromotor.
     * Wenn der Index nicht zwischen 1 und 2 liegt wird kein Wert gesetzt und ein Ton ausgegeben.
     * @param index des Elektromotors
     * @param leistung die der Elektromotors abgeben soll
     */
    //% block="Setze Leistung für Elektromotor $index auf $leistung"
    //% leistung.min=-100 leistung.max=100
    //% index.min=1 index.max=2
    //% leistung.defl=0
    //% index.defl=1
    export function setMotorPower(
        index?: number,
        leistung?: number) {

        if (index >= 1 && index <= 2) {
            let motorDriverPort = (index - 1) 

            // set new direction
            if (leistung < 0) {
                electricMotorDirection[motorDriverPort] = 1
            } else {
                electricMotorDirection[motorDriverPort] = 0
            }
            // set new speed
            electricMotorOutput[motorDriverPort] = Math.abs(leistung)
            if (electricMotorOutput[motorDriverPort] > 100) {
                electricMotorOutput[motorDriverPort] = 100
            }
        }
        else {
            music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }

    
    /**
     * Sende alle Leistungswerte zu den Motortreibern.
     * Muss immer ausgeführt werden wenn neu gesetzte Werte angezeigt werden sollen.
     */
    //% block="Sende alle Leistungswerte zum Motortreiber"
    export function writeAll() {
        let directionBuffer = pins.createBuffer(3)
        let speedBuffer = pins.createBuffer(3)
               
       
        //set direction buffer
        directionBuffer[0] = DirectionSet
        if (electricMotorDirection[0] == 0 && electricMotorDirection[1] == 0) {
            directionBuffer[1] = BothAntiClockWise
        } else if (electricMotorDirection[0] == 0 && electricMotorDirection[1] == 1) {
            directionBuffer[1] = M1ACWM2CW
        } else if (electricMotorDirection[0] == 1 && electricMotorDirection[1] == 0) {
            directionBuffer[1] = M1CWM2ACW
        } else {
            //both are forward (1)
            directionBuffer[1] = BothClockWise
        }
        directionBuffer[2] = Nothing
        let status;
        status = pins.i2cWriteBuffer(DriverAddress, directionBuffer, false)

        if (status != 0){ resetI2CDevices(); }

        basic.pause(1)

        //set power
        let scaling_pwm = 2.55 * 0.85;
        speedBuffer[0] = MotorSpeedSet
        speedBuffer[1] = Math.floor(electricMotorOutput[0]*scaling_pwm)
        speedBuffer[2] = Math.floor(electricMotorOutput[1]*scaling_pwm)
        status = pins.i2cWriteBuffer(DriverAddress, speedBuffer, false)

        if (status != 0){ resetI2CDevices(); }

        
        basic.pause(1)
        

    }
}