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

import { EventHandler } from "@atomist/skill/lib/handler";
import { slackInfoMessage } from "@atomist/skill/lib/messages";
import { gitHubComRepository } from "@atomist/skill/lib/project";
import { gitHub } from "@atomist/skill/lib/project/github";
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import {
    codeLine,
    url,
} from "@atomist/slack-messages";
import * as _ from "lodash";
import { AnnounceOnCommitSubscription } from "../typings/types";

export const handler: EventHandler<AnnounceOnCommitSubscription, ClaxonConfiguration> = async ctx => {
    const commit = ctx.data.Commit[0];
    const repo = commit.repo;
    const workspaceId = repo.name.split("-")[0];

    if ((ctx.configuration[0]?.parameters?.workspaces || []).includes(workspaceId)) {
        return {
            code: 0,
            reason: `Workspace ${workspaceId} ignored`,
            visibility: "hidden",
        };
    }

    const credential = await ctx.credential.resolve(gitHubAppToken({
        owner: repo.owner,
        repo: repo.name,
        apiUrl: repo.org.provider.apiUrl,
    }));

    let commitMsg = `_${commit.message.split("\n")[0]}_`;
    const generated = commit.message.includes("[atomist:generated]");

    const gitCommit = (await gitHub(gitHubComRepository({ owner: repo.owner, repo: repo.name, credential })).repos.getCommit({
        owner: repo.owner,
        repo: repo.name,
        ref: commit.sha,
    })).data;

    if (!generated) {
        commitMsg = gitCommit.files.map(f => `_${_.upperFirst(f.status)} ${f.filename}_`).join("\n");
    }

    const msg = slackInfoMessage(
        `@${commit.author.login}`,
        commitMsg,
        ctx);
    msg.attachments[0].author_icon = gitCommit?.author?.avatar_url;
    msg.attachments[0].author_link = gitCommit?.author?.html_url;
    msg.attachments[0].footer =
        `${msg.attachments[0].footer} \u00B7 ${workspaceId} \u00B7 ${url(gitCommit?.html_url, codeLine(commit.sha.slice(0, 7)))}`;

    await ctx.message.send(
        msg,
        {
            channels: ctx.configuration[0]?.parameters?.channels || [],
            users: ctx.configuration[0]?.parameters?.users || [],
        });

    return {
        code: 0,
        reason: `Send Skill configuration update`,
    };
};
