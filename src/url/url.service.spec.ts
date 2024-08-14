import { UrlService } from './url.service.js';

describe('UrlService', () => {
  let urlService: UrlService;

  beforeEach(() => {
    urlService = new UrlService();
  });

  it('should be created', () => {
    expect(urlService).toBeTruthy();
  });

  // Add more test cases here
});
