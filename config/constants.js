let constants = {
    encodeJWT: 'secret',
    encodeBcrypt: '',
    minLengthUsername: 6,
    minLengthPassword: 6,
    saltRounds: 10,
    limit_DEFAULT: 20,
    offset_DEFAULT: 0,
    formatSplitText: '-__-__-__-',
    workday: 22,
    workhourinday: 8,
    hours_offmorning: 4,
    hours_offafternoon: 4,
    coefficientNormal: 1.5,
    coefficientWeekend: 2,
    coefficientHoliday: 3
}
module.exports = constants;