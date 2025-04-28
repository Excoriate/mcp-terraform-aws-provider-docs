import { assert, assertEquals } from "jsr:@std/assert";
import { RESOURCES, getResourceByUri } from "../lib/mcp/resources.ts";

Deno.test("getResourceByUri: returns resource for valid URI", () => {
	const uri = RESOURCES[0].uri;
	const resource = getResourceByUri(uri);
	assert(resource, "Resource should be found for valid URI");
	assertEquals(resource?.uri, uri);
});

Deno.test("getResourceByUri: returns undefined for invalid URI", () => {
	const resource = getResourceByUri("nonexistent://uri");
	assertEquals(resource, undefined);
});
