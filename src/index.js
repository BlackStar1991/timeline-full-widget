import { registerBlockType } from "@wordpress/blocks";

registerBlockType("za/timeline-full-widget", {
    title: "Timeline Full Widget",
    icon: "schedule",
    category: "widgets",

    edit() {

        return <h2>Block Timeline Editor</h2>;
    },

    save() {

        return <h2>Timeline output on the front</h2>;
    },
});

