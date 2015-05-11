
module.exports = {
    stepNames: [
      'part1_step1',
      'part1_step2',
      'part1_step3',
      'part1_step4'
    ],
    devices: {
        'phone': {
            // position: {
            //     top: -126,
            //     left: -39,
            //     width: 1025,
            //     height: 768
            // },
            viewport: 'width=device-width, initial-scale=1',
            stepUrls: {
                'part1_step1': 'http://www.apple.com/iphone/',
                'part1_step2': 'http://artefactgroup.com/',
                'part1_step4': 'http://github.com/'
            }
        },
        'tablet': {
            stepUrls: {
                'part1_step1': 'http://www.apple.com/ipad/',
                'part1_step3': 'https://www.youtube.com/embed/epHkaOxZhV8?t-2m49s',
                5: 'http://github.com/'
            }
        }
    }
}
