const helper = require('../../common/helper');

const { models, validators, validatorUtils } = require('../../../src/components/validators');
const { realSmallFile, smallFile } = require('../../fixtures/base64Files');

helper.logHelper();

describe('models.attachment.content', () => {

  it('should return true for populated string', () => {
    const value = 'this is a populated string';
    const result = models.attachment.content(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated string object', () => {
    const value = String('this is a populated string');
    const result = models.attachment.content(value);
    expect(result).toBeTruthy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.attachment.content(value);
    expect(result).toBeFalsy();
  });

  it('should return false for empty string', () => {
    const value = '';
    const result = models.attachment.content(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '                     ';
    const result = models.attachment.content(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array argument', () => {
    const value = [];
    const result = models.attachment.content(value);
    expect(result).toBeFalsy();
  });

  it('should return false for number argument', () => {
    const value = 123;
    const result = models.attachment.content(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object argument', () => {
    const value = { value: 123 };
    const result = models.attachment.content(value);
    expect(result).toBeFalsy();
  });

});

describe('models.attachment.contentType', () => {

  it('should return true for populated string', () => {
    const value = 'this is the content type';
    const result = models.attachment.contentType(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated string object', () => {
    const value = String('this is the content type');
    const result = models.attachment.contentType(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.attachment.contentType(value);
    expect(result).toBeTruthy();
  });

  it('should return true for empty string', () => {
    const value = '';
    const result = models.attachment.contentType(value);
    expect(result).toBeTruthy();
  });

  it('should return false for all whitespace string', () => {
    const value = '           ';
    const result = models.attachment.contentType(value);
    expect(result).toBeFalsy();
  });

  it('should return false for non-string value', () => {
    const value = 123;
    const result = models.attachment.contentType(value);
    expect(result).toBeFalsy();
  });

});

describe('models.attachment.encoding', () => {

  it('should return true for "base64"', () => {
    const value = 'base64';
    const result = models.attachment.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "binary"', () => {
    const value = 'binary';
    const result = models.attachment.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "hex"', () => {
    const value = 'hex';
    const result = models.attachment.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.attachment.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for empty string', () => {
    const value = '';
    const result = models.attachment.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return false for all whitespace string', () => {
    const value = '           ';
    const result = models.attachment.encoding(value);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid value', () => {
    const value = 'xhexx';
    const result = models.attachment.encoding(value);
    expect(result).toBeFalsy();
  });

  it('should return false for non-string value', () => {
    const value = 123;
    const result = models.attachment.encoding(value);
    expect(result).toBeFalsy();
  });

});

describe('models.attachment.filename', () => {

  it('should return true for populated string', () => {
    const value = 'this is a populated string';
    const result = models.attachment.filename(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated string object', () => {
    const value = String('this is a populated string');
    const result = models.attachment.filename(value);
    expect(result).toBeTruthy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.attachment.filename(value);
    expect(result).toBeFalsy();
  });

  it('should return false for empty string', () => {
    const value = '';
    const result = models.attachment.filename(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '                     ';
    const result = models.attachment.filename(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array argument', () => {
    const value = [];
    const result = models.attachment.filename(value);
    expect(result).toBeFalsy();
  });

  it('should return false for number argument', () => {
    const value = 123;
    const result = models.attachment.filename(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object argument', () => {
    const value = { value: 123 };
    const result = models.attachment.filename(value);
    expect(result).toBeFalsy();
  });

  it('should return true for file size equal to limit', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64', smallFile.size);
    expect(result).toBeTruthy();
  });

  it('should return true for file smaller than limit', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64', smallFile.size + 1);
    expect(result).toBeTruthy();
  });

  it('should return false for file larger than limit', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64', smallFile.size - 1);
    expect(result).toBeFalsy();
  });

  it('should return false for no content', async () => {
    const content = '';
    const result = await models.attachment.size(content, 'base64', smallFile.size);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid encoding', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64xxx', smallFile.size);
    expect(result).toBeFalsy();
  });

  it('should return true for bytes parseable limit', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64', '1mb');
    expect(result).toBeTruthy();
  });

  it('should return false for invalid limit', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64', 'bad limit cannot parse');
    expect(result).toBeFalsy();
  });

  it('should return false for limit less than 1 byte', async () => {
    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64', 0);
    expect(result).toBeFalsy();
  });

  it('should return false on temp file handling error', async () => {
    const tmp = require('tmp');
    const spy = jest.spyOn(tmp, 'fileSync');
    spy.mockImplementation(() => {
      throw new Error('coverage');
    });

    const content = smallFile.content;
    const result = await models.attachment.size(content, 'base64');
    expect(result).toBeFalsy();

    spy.mockRestore();
  });
});

describe('models.context.bcc', () => {

  it('should return true for undefined', () => {
    const list = undefined;
    const result = models.context.bcc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for empty array', () => {
    const list = [];
    const result = models.context.bcc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.context.bcc(list);
    expect(result).toBeTruthy();
  });

  it('should return false for array where a value is not an email address', () => {
    const list = ['this is not a valid email value', 'email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.context.bcc(list);
    expect(result).toBeFalsy();
  });

  it('should return false for non-array argument', () => {
    const value = '"Email Address Jr." <email2@address2.com>';
    const result = models.context.bcc(value);
    expect(result).toBeFalsy();
  });

});

describe('models.context.cc', () => {

  it('should return true for undefined', () => {
    const list = undefined;
    const result = models.context.cc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for empty array', () => {
    const list = [];
    const result = models.context.cc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.context.cc(list);
    expect(result).toBeTruthy();
  });

  it('should return false for array where a value is not an email address', () => {
    const list = ['this is not a valid email value', 'email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.context.cc(list);
    expect(result).toBeFalsy();
  });

  it('should return false for non-array argument', () => {
    const value = '"Email Address Jr." <email2@address2.com>';
    const result = models.context.cc(value);
    expect(result).toBeFalsy();
  });

});

describe('models.context.delayTS', () => {

  it('should return true for null', () => {
    const value = null;
    const result = models.context.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.context.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for int', () => {
    const value = 123;
    const result = models.context.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for empty string', () => {
    const value = '';
    const result = models.context.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for int string', () => {
    const value = '123';
    const result = models.context.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated int string object', () => {
    const value = String('123');
    const result = models.context.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return false for float', () => {
    const value = 123.45;
    const result = models.context.delayTS(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '                     ';
    const result = models.context.delayTS(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array argument', () => {
    const value = [];
    const result = models.context.delayTS(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object argument', () => {
    const value = { value: 123 };
    const result = models.context.delayTS(value);
    expect(result).toBeFalsy();
  });
});

describe('models.context.keys', () => {

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.context.keys(value);
    expect(result).toBeFalsy();
  });

  it('should return false for string', () => {
    const value = 'this is a string';
    const result = models.context.keys(value);
    expect(result).toBeFalsy();
  });

  it('should return false for number', () => {
    const value = 123;
    const result = models.context.keys(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array', () => {
    const value = ['this is a string'];
    const result = models.context.keys(value);
    expect(result).toBeFalsy();
  });

  it('should return true for valid context', () => {
    const value = {
      'test': '123',
      'this_is_a_valid_key_from_json_123': 'pass',
      'subObject': { 'good': 'good key name' }
    };
    const result = models.context.keys(value);
    expect(result).toBeTruthy();
  });

  it('should return false for context with bad key/field', () => {
    const value = {
      'test': '123',
      'this_is_a_valid_key_from_json_123': 'pass',
      'subObject': { 'good': 'good key name' },
      'a1_&': 'bad key'
    };
    const result = models.context.keys(value);
    expect(result).toBeFalsy();
  });

  it('should return false for context with bad key/field in sub-object', () => {
    const value = {
      'test': '123',
      'this_is_a_valid_key_from_json_123': 'pass',
      'subObject': { 'good': 'good key name', 'a1_&': 'bad key' }
    };
    const result = models.context.keys(value);
    expect(result).toBeFalsy();
  });

});

describe('models.context.tag', () => {

  it('should return true for string', () => {
    const value = 'this is a tag';
    const result = models.context.tag(value);
    expect(result).toBeTruthy();
  });

  it('should return true for string object', () => {
    const value = String('this is a tag');
    const result = models.context.tag(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.context.tag(value);
    expect(result).toBeTruthy();
  });

  it('should return false for number', () => {
    const value = 123;
    const result = models.context.tag(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object', () => {
    const value = {};
    const result = models.context.tag(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array', () => {
    const value = [];
    const result = models.context.tag(value);
    expect(result).toBeFalsy();
  });

});

describe('models.contexts.to', () => {

  it('should return false for undefined', () => {
    const list = undefined;
    const result = models.context.to(list);
    expect(result).toBeFalsy();
  });

  it('should return false for empty array', () => {
    const list = [];
    const result = models.context.to(list);
    expect(result).toBeFalsy();
  });

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.context.to(list);
    expect(result).toBeTruthy();
  });

  it('should return false for array where a value is not an email address', () => {
    const list = ['this is not a valid email value', 'email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.context.to(list);
    expect(result).toBeFalsy();
  });

  it('should return false for non-array argument', () => {
    const value = '"Email Address Jr." <email2@address2.com>';
    const result = models.context.to(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.bcc', () => {

  it('should return true for undefined', () => {
    const list = undefined;
    const result = models.message.bcc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for empty array', () => {
    const list = [];
    const result = models.message.bcc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.message.bcc(list);
    expect(result).toBeTruthy();
  });

  it('should return false for array where a value is not an email address', () => {
    const list = ['this is not a valid email value', 'email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.message.bcc(list);
    expect(result).toBeFalsy();
  });

  it('should return false for non-array argument', () => {
    const value = '"Email Address Jr." <email2@address2.com>';
    const result = models.message.bcc(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.body', () => {

  it('should return true for populated string', () => {
    const value = 'this is a populated string';
    const result = models.message.body(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated string object', () => {
    const value = String('this is a populated string');
    const result = models.message.body(value);
    expect(result).toBeTruthy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.message.body(value);
    expect(result).toBeFalsy();
  });

  it('should return false for empty string', () => {
    const value = '';
    const result = models.message.body(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '                     ';
    const result = models.message.body(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array argument', () => {
    const value = [];
    const result = models.message.body(value);
    expect(result).toBeFalsy();
  });

  it('should return false for number argument', () => {
    const value = 123;
    const result = models.message.body(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object argument', () => {
    const value = { value: 123 };
    const result = models.message.body(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.bodyType', () => {

  it('should return true for "html"', () => {
    const value = 'html';
    const result = models.message.bodyType(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "text"', () => {
    const value = 'text';
    const result = models.message.bodyType(value);
    expect(result).toBeTruthy();
  });

  it('should return false for undefined value', () => {
    const value = undefined;
    const result = models.message.bodyType(value);
    expect(result).toBeFalsy();
  });

  it('should return false for empty value', () => {
    const value = '';
    const result = models.message.bodyType(value);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid value', () => {
    const value = 'xhtmlx';
    const result = models.message.bodyType(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.cc', () => {

  it('should return true for undefined', () => {
    const list = undefined;
    const result = models.message.cc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for empty array', () => {
    const list = [];
    const result = models.message.cc(list);
    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.message.cc(list);
    expect(result).toBeTruthy();
  });

  it('should return false for array where a value is not an email address', () => {
    const list = ['this is not a valid email value', 'email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.message.cc(list);
    expect(result).toBeFalsy();
  });

  it('should return false for non-array argument', () => {
    const value = '"Email Address Jr." <email2@address2.com>';
    const result = models.message.cc(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.delayTS', () => {

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for int', () => {
    const value = 123;
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for large integers', () => {
    const value = 1569878107287;
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for unix epoch ts', () => {
    const value = 1569879623;
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for empty string', () => {
    const value = '';
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for int string', () => {
    const value = '123';
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated int string object', () => {
    const value = String('123');
    const result = models.message.delayTS(value);
    expect(result).toBeTruthy();
  });

  it('should return false for float', () => {
    const value = 123.45;
    const result = models.message.delayTS(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '                     ';
    const result = models.message.delayTS(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array argument', () => {
    const value = [];
    const result = models.message.delayTS(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object argument', () => {
    const value = { value: 123 };
    const result = models.message.delayTS(value);
    expect(result).toBeFalsy();
  });
});

describe('models.message.encoding', () => {

  it('should return true for "base64"', () => {
    const value = 'base64';
    const result = models.message.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "binary"', () => {
    const value = 'binary';
    const result = models.message.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "hex"', () => {
    const value = 'hex';
    const result = models.message.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "utf-8"', () => {
    const value = 'utf-8';
    const result = models.message.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.message.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return true for empty string', () => {
    const value = '';
    const result = models.message.encoding(value);
    expect(result).toBeTruthy();
  });

  it('should return false for all whitespace string', () => {
    const value = '           ';
    const result = models.message.encoding(value);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid value', () => {
    const value = 'xhexx';
    const result = models.message.encoding(value);
    expect(result).toBeFalsy();
  });

  it('should return false for non-string value', () => {
    const value = 123;
    const result = models.message.encoding(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.from', () => {

  it('should return true for email address', () => {
    const value = 'email@address.com';
    const result = models.message.from(value);
    expect(result).toBeTruthy();
  });

  it('should return true for email address with display name', () => {
    const value = 'Email Address <email@address.com>';
    const result = models.message.from(value);
    expect(result).toBeTruthy();
  });

  it('should return false for non-email address', () => {
    const value = 'this is not an email address';
    const result = models.message.from(value);
    expect(result).toBeFalsy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.message.from(value);
    expect(result).toBeFalsy();
  });

  it('should return false for empty string', () => {
    const value = '';
    const result = models.message.from(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '     ';
    const result = models.message.from(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array', () => {
    const value = ['email@address.com'];
    const result = models.message.from(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object', () => {
    const value = { from: 'email@address.com' };
    const result = models.message.from(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.priority', () => {

  it('should return true for "normal"', () => {
    const value = 'normal';
    const result = models.message.priority(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "low"', () => {
    const value = 'low';
    const result = models.message.priority(value);
    expect(result).toBeTruthy();
  });

  it('should return true for "high"', () => {
    const value = 'high';
    const result = models.message.priority(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.message.priority(value);
    expect(result).toBeTruthy();
  });

  it('should return true for empty string', () => {
    const value = '';
    const result = models.message.priority(value);
    expect(result).toBeTruthy();
  });

  it('should return false for all whitespace string', () => {
    const value = '           ';
    const result = models.message.priority(value);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid value', () => {
    const value = 'xhighx';
    const result = models.message.priority(value);
    expect(result).toBeFalsy();
  });

  it('should return false for non-string value', () => {
    const value = 123;
    const result = models.message.priority(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.subject', () => {

  it('should return true for populated string', () => {
    const value = 'this is a populated string';
    const result = models.message.subject(value);
    expect(result).toBeTruthy();
  });

  it('should return true for populated string object', () => {
    const value = String('this is a populated string');
    const result = models.message.subject(value);
    expect(result).toBeTruthy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.message.subject(value);
    expect(result).toBeFalsy();
  });

  it('should return false for empty string', () => {
    const value = '';
    const result = models.message.subject(value);
    expect(result).toBeFalsy();
  });

  it('should return false for whitespace string', () => {
    const value = '                     ';
    const result = models.message.subject(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array argument', () => {
    const value = [];
    const result = models.message.subject(value);
    expect(result).toBeFalsy();
  });

  it('should return false for number argument', () => {
    const value = 123;
    const result = models.message.subject(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object argument', () => {
    const value = { value: 123 };
    const result = models.message.subject(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.tag', () => {

  it('should return true for string', () => {
    const value = 'this is a tag';
    const result = models.message.tag(value);
    expect(result).toBeTruthy();
  });

  it('should return true for string object', () => {
    const value = String('this is a tag');
    const result = models.message.tag(value);
    expect(result).toBeTruthy();
  });

  it('should return true for undefined', () => {
    const value = undefined;
    const result = models.message.tag(value);
    expect(result).toBeTruthy();
  });

  it('should return false for number', () => {
    const value = 123;
    const result = models.message.tag(value);
    expect(result).toBeFalsy();
  });

  it('should return false for object', () => {
    const value = {};
    const result = models.message.tag(value);
    expect(result).toBeFalsy();
  });

  it('should return false for array', () => {
    const value = [];
    const result = models.message.tag(value);
    expect(result).toBeFalsy();
  });

});

describe('models.message.to', () => {

  it('should return false for undefined', () => {
    const list = undefined;
    const result = models.message.to(list);
    expect(result).toBeFalsy();
  });

  it('should return false for empty array', () => {
    const list = [];
    const result = models.message.to(list);
    expect(result).toBeFalsy();
  });

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.message.to(list);
    expect(result).toBeTruthy();
  });

  it('should return false for array where a value is not an email address', () => {
    const list = ['this is not a valid email value', 'email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = models.message.to(list);
    expect(result).toBeFalsy();
  });

  it('should return false for non-array argument', () => {
    const value = '"Email Address Jr." <email2@address2.com>';
    const result = models.message.to(value);
    expect(result).toBeFalsy();
  });

});

describe('models.queryParams.msgId', () => {
  const fn = models.queryParams.msgId;

  it('should return true for valid UUID strings', () => {
    expect(fn('00000000-0000-0000-0000-000000000000')).toBeTruthy();
    expect(fn('11111111-1111-1111-0111-111111111111')).toBeTruthy();
    expect(fn('ac2b944a-c148-4dfe-8103-d4cdc6b0a79a')).toBeTruthy();
    expect(fn('86a12b0d-6d7a-491c-a1fb-98db9543bf55')).toBeTruthy();
  });

  it('should return true for valid UUID string object', () => {
    expect(fn(String('00000000-0000-0000-0000-000000000000'))).toBeTruthy();
  });

  it('should return true for undefined', () => {
    expect(fn(undefined)).toBeTruthy();
  });

  it('should return false on invalid UUID strings', () => {
    expect(fn('66666666-6666-6666-6666-66666666')).toBeFalsy();
    expect(fn('garbage')).toBeFalsy();
  });

  it('should return false for a number', () => {
    expect(fn(123)).toBeFalsy();
  });

  it('should return false for an object', () => {
    expect(fn({})).toBeFalsy();
  });

  it('should return false for an array', () => {
    expect(fn([])).toBeFalsy();
  });
});

describe('models.queryParams.status', () => {
  const fn = models.queryParams.status;

  it('should return true for a valid string', () => {
    expect(fn('accepted')).toBeTruthy();
    expect(fn('cancelled')).toBeTruthy();
    expect(fn('completed')).toBeTruthy();
    expect(fn('failed')).toBeTruthy();
    expect(fn('pending')).toBeTruthy();
  });

  it('should return true for a valid string object', () => {
    expect(fn(String('accepted'))).toBeTruthy();
    expect(fn(String('cancelled'))).toBeTruthy();
    expect(fn(String('completed'))).toBeTruthy();
    expect(fn(String('failed'))).toBeTruthy();
    expect(fn(String('pending'))).toBeTruthy();
  });

  it('should return false for an invalid string', () => {
    expect(fn('invalid')).toBeFalsy();
  });

  it('should return true for an invalid string object', () => {
    expect(fn(String('invalid'))).toBeFalsy();
  });

  it('should return true for undefined', () => {
    expect(fn(undefined)).toBeTruthy();
  });

  it('should return false for a number', () => {
    expect(fn(123)).toBeFalsy();
  });

  it('should return false for an object', () => {
    expect(fn({})).toBeFalsy();
  });

  it('should return false for an array', () => {
    expect(fn([])).toBeFalsy();
  });
});

describe('models.queryParams.tag', () => {
  const fn = models.queryParams.tag;

  it('should return true for a string', () => {
    expect(fn('this is a tag')).toBeTruthy();
  });

  it('should return true for a string object', () => {
    expect(fn(String('this is a tag'))).toBeTruthy();
  });

  it('should return true for undefined', () => {
    expect(fn(undefined)).toBeTruthy();
  });

  it('should return false for a number', () => {
    expect(fn(123)).toBeFalsy();
  });

  it('should return false for an object', () => {
    expect(fn({})).toBeFalsy();
  });

  it('should return false for an array', () => {
    expect(fn([])).toBeFalsy();
  });
});

describe('models.queryParams.txId', () => {
  const fn = models.queryParams.txId;

  it('should return true for valid UUID strings', () => {
    expect(fn('00000000-0000-0000-0000-000000000000')).toBeTruthy();
    expect(fn('11111111-1111-1111-0111-111111111111')).toBeTruthy();
    expect(fn('ac2b944a-c148-4dfe-8103-d4cdc6b0a79a')).toBeTruthy();
    expect(fn('86a12b0d-6d7a-491c-a1fb-98db9543bf55')).toBeTruthy();
  });

  it('should return true for valid UUID string object', () => {
    expect(fn(String('00000000-0000-0000-0000-000000000000'))).toBeTruthy();
  });

  it('should return true for undefined', () => {
    expect(fn(undefined)).toBeTruthy();
  });

  it('should return false on invalid UUID strings', () => {
    expect(fn('66666666-6666-6666-6666-66666666')).toBeFalsy();
    expect(fn('garbage')).toBeFalsy();
  });

  it('should return false for a number', () => {
    expect(fn(123)).toBeFalsy();
  });

  it('should return false for an object', () => {
    expect(fn({})).toBeFalsy();
  });

  it('should return false for an array', () => {
    expect(fn([])).toBeFalsy();
  });
});

describe('validators.attachments', () => {

  it('should return empty error list for undefined attachments', async () => {
    const obj = {};
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(0);
  });

  it('should return empty error list for attachments as array', async () => {
    const obj = {
      attachments: []
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(0);
  });

  it('should return error list when attachments is not array', async () => {
    const obj = {
      attachments: {}
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(1);
  });

  it('should return empty error list for valid attachments', async () => {
    const obj = {
      attachments: [
        {
          filename: 'file.pdf',
          encoding: 'base64',
          contentType: 'application/pdf',
          content: smallFile.content
        }]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error for each attachment that is too large', async () => {
    const obj = {
      attachments: [
        { filename: 'fileOk.pdf', encoding: 'base64', contentType: 'application/pdf', content: realSmallFile.content },
        { filename: 'file1.pdf', encoding: 'base64', contentType: 'application/pdf', content: smallFile.content },
        { filename: 'file2.pdf', encoding: 'base64', contentType: 'application/pdf', content: smallFile.content }
      ]
    };
    const result = await validators.attachments(obj, realSmallFile.size);
    expect(result).toHaveLength(2);
  });

  it('should return an error when attachment filename key not provided', async () => {
    const obj = {
      attachments: [
        { encoding: 'base64', contentType: 'application/pdf', content: realSmallFile.content }
      ]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/filename/);
  });

  it('should return an error when attachment filename value is bad', async () => {
    const obj = {
      attachments: [
        { filename: '', encoding: 'base64', contentType: 'application/pdf', content: realSmallFile.content }
      ]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/filename/);
  });

  it('should return an error when attachment encoding value is bad', async () => {
    const obj = {
      attachments: [
        {
          filename: 'fileOk.pdf',
          encoding: 'base64xxx',
          contentType: 'application/pdf',
          content: realSmallFile.content
        }
      ]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/encoding/);
  });

  it('should return no error when attachment encoding key not provided', async () => {
    const obj = {
      attachments: [
        { filename: 'fileOk.pdf', contentType: 'application/pdf', content: realSmallFile.content }
      ]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when attachment contentType value is bad', async () => {
    const obj = {
      attachments: [
        { filename: 'fileOk.pdf', encoding: 'base64', contentType: 123, content: realSmallFile.content }
      ]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/contentType/);
  });

  it('should return no error when attachment contentType key not provided', async () => {
    const obj = {
      attachments: [
        { filename: 'fileOk.pdf', encoding: 'base64', content: realSmallFile.content }
      ]
    };
    const result = await validators.attachments(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when attachment has no content', async () => {
    const obj = {
      attachments: [
        { filename: 'fileOk.pdf', encoding: 'base64', contentType: 'application/pdf', content: undefined }
      ]
    };
    const result = await validators.attachments(obj, realSmallFile.size);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/content/);
  });

  it('should return an error when attachment content key not provided', async () => {
    const obj = {
      attachments: [
        { filename: 'fileOk.pdf', encoding: 'base64', contentType: 'application/pdf' }
      ]
    };
    const result = await validators.attachments(obj, realSmallFile.size);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/content/);
  });

});

describe('validators.cancelMsg', () => {
  let param;

  beforeEach(() => {
    param = {
      msgId: '00000000-0000-0000-0000-000000000000',
    };
  });

  it('should return an empty error array when valid', () => {
    const result = validators.cancelMsg(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error when msgId is missing', () => {
    param.msgId = undefined;

    const result = validators.cancelMsg(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].value).toBeUndefined();
    expect(result[0].message).toMatch('Missing value `msgId`.');
  });

  it('should return an error when msgId is invalid', () => {
    param.msgId = 'garbage';

    const result = validators.cancelMsg(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].value).toMatch(param.msgId);
    expect(result[0].message).toMatch('Invalid value `msgId`.');
  });
});

describe('validators.cancelQuery', () => {
  let query;

  beforeEach(() => {
    query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };
  });

  it('should return an empty error array when all valid', () => {
    const result = validators.cancelQuery(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an empty error array with some missing parameters', () => {
    delete query.status;
    delete query.txId;

    const result = validators.cancelQuery(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error with some validation errors', () => {
    query.txId = 'garbage';

    const result = validators.cancelQuery(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
  });

  it('should return an error when all parameters are missing', () => {
    const result = validators.cancelQuery({});

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch(/At least one of/);
    expect(result[0].value).toMatch('params');
  });
});

describe('validators.promoteMsg', () => {
  let param;

  beforeEach(() => {
    param = {
      msgId: '00000000-0000-0000-0000-000000000000',
    };
  });

  it('should return an empty error array when valid', () => {
    const result = validators.promoteMsg(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error when msgId is missing', () => {
    param.msgId = undefined;

    const result = validators.promoteMsg(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].value).toBeUndefined();
    expect(result[0].message).toMatch('Missing value `msgId`.');
  });

  it('should return an error when msgId is invalid', () => {
    param.msgId = 'garbage';

    const result = validators.promoteMsg(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].value).toMatch(param.msgId);
    expect(result[0].message).toMatch('Invalid value `msgId`.');
  });
});

describe('validators.email', () => {

  const goodEmail = {
    from: '"Email Sender" <email@sender.org>',
    to: ['"Email Recipient" <email@recipient.org>', 'recipient@email.org'],
    cc: ['"CC Recipient" <cc@recipient.org>'],
    bcc: ['"BCC Recipient" <cc@recipient.org>'],
    subject: 'Email subject',
    bodyType: 'text',
    body: 'This is the email body.  It is plain text',
    delayTS: 1570000,
    encoding: 'utf-8',
    priority: 'normal',
    tag: 'this is a good tag',
    attachments: [
      {
        filename: 'fileOk.pdf',
        encoding: 'base64',
        contentType: 'application/pdf',
        content: realSmallFile.content
      }]
  };

  it('should return empty error list for a complete and valid email message', async () => {
    const obj = { ...goodEmail };
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message has invalid attachment', async () => {
    const obj = { ...goodEmail };
    obj.attachments = [{ encoding: 'base64', contentType: 'application/pdf', content: realSmallFile.content }];

    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Attachments/);
    expect(result[0].message).toMatch(/filename/);
  });

  it('should return an error when email message no from', async () => {
    const obj = { ...goodEmail };
    delete obj.from;
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/from/);
  });

  it('should return an error when email message invalid from', async () => {
    const obj = { ...goodEmail };
    obj.from = 'not a good from';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/from/);
  });

  it('should return an error when email message no to', async () => {
    const obj = { ...goodEmail };
    delete obj.to;
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/to/);
  });

  it('should return an error when email message invalid to', async () => {
    const obj = { ...goodEmail };
    obj.to = 'not a good from';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/to/);
  });

  it('should not return an error when email message no cc', async () => {
    const obj = { ...goodEmail };
    delete obj.cc;
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid cc', async () => {
    const obj = { ...goodEmail };
    obj.cc = 'not a good to';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/cc/);
  });

  it('should not return an error when email message no bcc', async () => {
    const obj = { ...goodEmail };
    delete obj.bcc;
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid bcc', async () => {
    const obj = { ...goodEmail };
    obj.bcc = 'not a good bcc';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/bcc/);
  });

  it('should return an error when email message no subject', async () => {
    const obj = { ...goodEmail };
    delete obj.subject;
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/subject/);
  });

  it('should return an error when email message invalid subject', async () => {
    const obj = { ...goodEmail };
    obj.subject = 123;
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/subject/);
  });

  it('should return an error when email message no bodyType', async () => {
    const obj = { ...goodEmail };
    delete obj.bodyType;
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/bodyType/);
  });

  it('should return an error when email message invalid bodyType', async () => {
    const obj = { ...goodEmail };
    obj.bodyType = 'xhtmlx';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/bodyType/);
  });

  it('should return an error when email message no body', async () => {
    const obj = { ...goodEmail };
    delete obj.body;
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/body/);
  });

  it('should return an error when email message invalid body', async () => {
    const obj = { ...goodEmail };
    obj.body = {};
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/body/);
  });

  it('should not return an error when email message no encoding', async () => {
    const obj = { ...goodEmail };
    delete obj.encoding;
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid encoding', async () => {
    const obj = { ...goodEmail };
    obj.encoding = 'not a good encoding';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/encoding/);
  });

  it('should not return an error when email message no priority', async () => {
    const obj = { ...goodEmail };
    delete obj.priority;
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid priority', async () => {
    const obj = { ...goodEmail };
    obj.priority = 'not a good priority';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/priority/);
  });

  it('should not return an error when email message has no tag', async () => {
    const obj = { ...goodEmail };
    delete obj.tag;
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid tag', async () => {
    const obj = { ...goodEmail };
    obj.tag = ['not a good tag'];
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/tag/);
  });

  it('should not return an error when email message has no delayTS', async () => {
    const obj = { ...goodEmail };
    delete obj.delayTS;
    const result = await validators.email(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid delayTS', async () => {
    const obj = { ...goodEmail };
    obj.delayTS = 'not a good delayTS';
    const result = await validators.email(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/delayTS/);
  });

});

describe('validators.merge', () => {

  const goodMergeObject = () => {
    return {
      attachments: [
        {
          filename: 'fileOk.pdf',
          encoding: 'base64',
          contentType: 'application/pdf',
          content: realSmallFile.content
        }],
      bodyType: 'text',
      body: 'This is the email body.  It is plain text',
      contexts: [
        {
          to: ['"Email Recipient" <email@recipient.org>', 'recipient@email.org'],
          cc: ['"CC Recipient" <cc@recipient.org>'],
          bcc: ['"BCC Recipient" <cc@recipient.org>'],
          context: {
            keyA: 'valueA',
            keyB: 'valueB',
            stringArray: ['a', 'b', 'c'],
            intArray: [1, 2, 3],
            objArray: [{ a: 1, b: 2, c: 3 }],
            subObject: {
              a: 1,
              b: 2,
              c: '3'
            }
          },
          delayTS: 157000,
          tag: 'this is a good tag'
        }
      ],
      encoding: 'utf-8',
      from: '"Email Sender" <email@sender.org>',
      priority: 'normal',
      subject: 'Email subject'
    };
  };

  it('should return empty error list for a complete and valid merge message', async () => {
    const obj = goodMergeObject();
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when merge has invalid attachment', async () => {
    const obj = goodMergeObject();
    obj.attachments = [{ encoding: 'base64', contentType: 'application/pdf', content: realSmallFile.content }];

    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Attachments/);
    expect(result[0].message).toMatch(/filename/);
  });

  it('should return an error when merge has no from', async () => {
    const obj = goodMergeObject();
    delete obj.from;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/from/);
  });

  it('should return an error when merge has invalid from', async () => {
    const obj = goodMergeObject();
    obj.from = 'not a good from';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/from/);
  });

  it('should return an error when merge has no subject', async () => {
    const obj = goodMergeObject();
    delete obj.subject;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/subject/);
  });

  it('should return an error when merge has invalid subject', async () => {
    const obj = goodMergeObject();
    obj.subject = 123;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/subject/);
  });

  it('should return an error when merge has no bodyType', async () => {
    const obj = goodMergeObject();
    delete obj.bodyType;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/bodyType/);
  });

  it('should return an error when merge has invalid bodyType', async () => {
    const obj = goodMergeObject();
    obj.bodyType = 'xhtmlx';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/bodyType/);
  });

  it('should return an error when merge has no body', async () => {
    const obj = goodMergeObject();
    delete obj.body;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/body/);
  });

  it('should return an error when merge has invalid body', async () => {
    const obj = goodMergeObject();
    obj.body = {};
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/body/);
  });

  it('should not return an error when merge has no encoding', async () => {
    const obj = goodMergeObject();
    delete obj.encoding;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when merge has invalid encoding', async () => {
    const obj = goodMergeObject();
    obj.encoding = 'not a good encoding';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/encoding/);
  });

  it('should not return an error when merge has no priority', async () => {
    const obj = goodMergeObject();
    delete obj.priority;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when merge has invalid priority', async () => {
    const obj = goodMergeObject();
    obj.priority = 'not a good priority';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/priority/);
  });

  it('should return an error when merges has no contexts', async () => {
    const obj = goodMergeObject();
    delete obj.contexts;

    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
  });

  it('should return an error when merges contexts is not an array', async () => {
    const obj = goodMergeObject();
    obj.contexts = {};

    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/contexts/);
    expect(result[0].message).toMatch(/array/);
  });

  it('should return an error when merges contexts has no to', async () => {
    const obj = goodMergeObject();
    delete obj.contexts[0].to;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/to/);
  });

  it('should return an error when merges contexts invalid to', async () => {
    const obj = goodMergeObject();
    obj.contexts[0].to = 'not a good value';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/to/);
  });

  it('should not return an error when merges contexts has no cc', async () => {
    const obj = goodMergeObject();
    delete obj.contexts[0].cc;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when merges contexts invalid cc', async () => {
    const obj = goodMergeObject();
    obj.contexts[0].cc = 'not a good value';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/cc/);
  });

  it('should not return an error when merges contexts has no bcc', async () => {
    const obj = goodMergeObject();
    delete obj.contexts[0].bcc;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when merges contexts invalid bcc', async () => {
    const obj = goodMergeObject();
    obj.contexts[0].bcc = 'not a good value';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/bcc/);
  });

  it('should not return an error when merge contexts has no tag', async () => {
    const obj = goodMergeObject();
    delete obj.contexts[0].tag;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when merges contexts invalid tag', async () => {
    const obj = goodMergeObject();
    obj.contexts[0].tag = ['tag', 'tag'];
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/tag/);
  });

  it('should not return an error when merge contexts has no delayTS', async () => {
    const obj = goodMergeObject();
    delete obj.contexts[0].delayTS;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(0);
  });

  it('should return an error when email message invalid delayTS', async () => {
    const obj = goodMergeObject();
    obj.contexts[0].delayTS = 'not a good delayTS';
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/delayTS/);
  });

  it('should return an error when merges contexts has no context', async () => {
    const obj = goodMergeObject();
    delete obj.contexts[0].context;
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/context/);
  });

  it('should return an error when merges contexts has context with invalid keys', async () => {
    const obj = goodMergeObject();
    const badContext = {
      'to': ['"Email Recipient" <email@recipient.org>', 'recipient@email.org'],
      'cc': ['"CC Recipient" <cc@recipient.org>'],
      'bcc': ['"BCC Recipient" <cc@recipient.org>'],
      'context': {
        'spaces are bad': 'valueA',
        'keyB': 'valueB'
      }
    };
    obj.contexts.push(badContext);
    const result = await validators.merge(obj);
    expect(result).toHaveLength(1);
    expect(result[0].message).toMatch(/Contexts/);
    expect(result[0].message).toMatch(/alphanumeric/);
  });

});

describe('validators.statusFetch', () => {
  let param;

  beforeEach(() => {
    param = {
      msgId: '00000000-0000-0000-0000-000000000000',
    };
  });

  it('should return an empty error array when valid', () => {
    const result = validators.statusFetch(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error with validation error when invalid', () => {
    param.msgId = 'garbage';

    const result = validators.statusFetch(param);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].value).toMatch('garbage');
    expect(result[0].message).toMatch('Invalid value `msgId`.');
  });
});

describe('validators.statusQuery', () => {
  let query;

  beforeEach(() => {
    query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };
  });

  it('should return an empty error array when all valid', () => {
    const result = validators.statusQuery(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an empty error array with some missing parameters', () => {
    delete query.status;
    delete query.txId;

    const result = validators.statusQuery(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error with some validation errors', () => {
    query.txId = 'garbage';

    const result = validators.statusQuery(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
  });

  it('should return an error when all parameters are missing', () => {
    const result = validators.statusQuery({});

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch(/At least one of/);
    expect(result[0].value).toMatch('params');
  });
});

describe('validators.searchQueryFields', () => {
  let query;

  beforeEach(() => {
    query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };
  });

  it('should return an empty error array when all valid', () => {
    const result = validators.searchQueryFields(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error when msgId is invalid', () => {
    query.msgId = 'garbage';

    const result = validators.searchQueryFields(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch(/msgId/);
    expect(result[0].value).toBe(query.msgId);
  });

  it('should return an error when status is invalid', () => {
    query.status = [];

    const result = validators.searchQueryFields(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch(/status/);
    expect(result[0].value).toBe(query.status);
  });

  it('should return an error when tag is invalid', () => {
    query.tag = [];

    const result = validators.searchQueryFields(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch(/tag/);
    expect(result[0].value).toBe(query.tag);
  });

  it('should return an error when txId is invalid', () => {
    query.txId = 'garbage';

    const result = validators.searchQueryFields(query);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch(/txId/);
    expect(result[0].value).toBe(query.txId);
  });

  it('should return multiple errors with multiple invalid values', () => {
    const result = validators.searchQueryFields({
      msgId: 'garbage',
      status: [],
      tag: [],
      txId: 'garbage'
    });

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(4);
  });
});

describe('validatorUtils.isEmail', () => {

  it('should return true for email address', () => {
    const result = validatorUtils.isEmail('email@address.com');

    expect(result).toBeTruthy();
  });

  it('should return true for email address with display name', () => {
    const result = validatorUtils.isEmail('Email Address <email@address.com>');

    expect(result).toBeTruthy();
  });

  it('should return false for non-email address value', () => {
    const result = validatorUtils.isEmail('this is not an email');

    expect(result).toBeFalsy();
  });

  it('should return false for empty value', () => {
    const result = validatorUtils.isEmail('');

    expect(result).toBeFalsy();
  });

  it('should return false for whitespace value', () => {
    const result = validatorUtils.isEmail('            ');

    expect(result).toBeFalsy();
  });

  it('should return false for undefined value', () => {
    const result = validatorUtils.isEmail(undefined);

    expect(result).toBeFalsy();
  });

  it('should return false for non-string value', () => {
    const result = validatorUtils.isEmail(123);

    expect(result).toBeFalsy();
  });

});

describe('validatorUtils.isEmailList', () => {

  it('should return true for array of email addresses', () => {
    const list = ['email@address.com', 'email2@address2.com'];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses with display names', () => {
    const list = ['Email Address <email@address.com>', 'Email Address II <email2@address2.com>'];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return true for array of email addresses, some with display names', () => {
    const list = ['email@address.com', '"Email Address Jr." <email2@address2.com>'];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return true for an empty array', () => {
    const list = [];
    const result = validatorUtils.isEmailList(list);

    expect(result).toBeTruthy();
  });

  it('should return false for non-array value', () => {
    const result = validatorUtils.isEmailList({ field: 'value' });

    expect(result).toBeFalsy();
  });

  it('should return false for string value', () => {
    const result = validatorUtils.isEmailList('');

    expect(result).toBeFalsy();
  });

  it('should return false for undefined value', () => {
    const result = validatorUtils.isEmailList(undefined);

    expect(result).toBeFalsy();
  });

});

describe('validatorUtils.isInt', () => {

  it('should return true for a int', () => {
    const value = 123;
    const result = validatorUtils.isInt(value);

    expect(result).toBeTruthy();
  });

  it('should return true for a integer as string ', () => {
    const value = '123456';
    const result = validatorUtils.isInt(value);

    expect(result).toBeTruthy();
  });

  it('should return true for a integer as string object ', () => {
    const value = String(123456);
    const result = validatorUtils.isInt(value);

    expect(result).toBeTruthy();
  });

  it('should return false for a non-numeric string ', () => {
    const value = 'abcdefg1234567';
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

  it('should return false for a float ', () => {
    const value = 123.45;
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

  it('should return false for a float string ', () => {
    const value = '123.45';
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

  it('should return false for an array', () => {
    const result = validatorUtils.isInt([{ value: 123 }]);

    expect(result).toBeFalsy();
  });

  it('should return false for a function', () => {
    const value = x => {
      return String(x);
    };
    const result = validatorUtils.isInt(value);

    expect(result).toBeFalsy();
  });

});

describe('validatorUtils.isString', () => {

  it('should return true for a string', () => {
    const value = 'this is a string';
    const result = validatorUtils.isString(value);

    expect(result).toBeTruthy();
  });

  it('should return true for a string object ', () => {
    const value = String(123456);
    const result = validatorUtils.isString(value);

    expect(result).toBeTruthy();
  });

  it('should return false for a number ', () => {
    const value = 123456;
    const result = validatorUtils.isString(value);

    expect(result).toBeFalsy();
  });

  it('should return false for a non-string object ', () => {
    const result = validatorUtils.isString({ value: 'string' });

    expect(result).toBeFalsy();
  });

  it('should return false for an array', () => {
    const result = validatorUtils.isString([{ value: 'string' }]);

    expect(result).toBeFalsy();
  });

  it('should return false for a function', () => {
    const value = x => {
      return String(x);
    };
    const result = validatorUtils.isString(value);

    expect(result).toBeFalsy();
  });

});
