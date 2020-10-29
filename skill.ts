/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Category,
    ParameterType,
    parameter,
    skill,
} from "@atomist/skill";
import { ClaxonConfiguration } from "./lib/configuration";

export const Skill = skill<ClaxonConfiguration & { repos: any }>({

    categories: [Category.DevOps],

    runtime: {
        memory: 1024,
        timeout: 60,
    },

    parameters: {
        channels: {
            type: ParameterType.StringArray,
            displayName: "Channels",
            description: "Channel names to send Skill configuration changes to",
            required: false,
        },
        users: {
            type: ParameterType.StringArray,
            displayName: "Users",
            description: "User names to send Skill configuration changes to",
            required: false,
        },
        workspaces: {
            type: ParameterType.StringArray,
            displayName: "Workspaces to ignore",
            description: "Ids of workspaces to ignore",
            required: false,
        },
        repos: parameter.repoFilter({ required: false }),
    },

    subscriptions: ["@atomist/skill/github/onPush"],
});
